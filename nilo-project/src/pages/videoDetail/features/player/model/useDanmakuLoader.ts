import type { Danmaku } from "@/shared/model/Danmaku";
import * as videoApi from "@/pages/videoDetail/features/player/api/VideoApi";
import { useDanmakuStore } from "@/pages/videoDetail/features/player/store/DanmakuStore";

/** 单次请求最大跨度（毫秒） */
export const CHUNK_MS = 5000;
/** 覆盖前沿不足该值时预取下一段 */
export const PREFETCH_LEAD_MS = 1500;
/** timeupdate 节流间隔 */
const TICK_THROTTLE_MS = 250;

type TimeRange = { from: number; to: number };

export type DanmakuLoaderOptions = {
  getVideoId: () => string;
  getFileIndex: () => number;
  getDurationMs: () => number;
  /**
   * 仅有「新写入 map」的弹幕时回调。
   * 播放器侧应对这些条目做 emit 追加，切勿把全量列表传给 load(array)
   *（插件 load(有参) 不会清空队列，只会追加，会导致重复）。
   */
  onDanmakuAdded?: (added: Danmaku[]) => void;
};

/**
 * 弹幕按时间轴增量加载：维护已覆盖区间集，按跳转锚点拉取未覆盖子区间。
 */
export function createDanmakuLoader(options: DanmakuLoaderOptions) {
  const danmakuStore = useDanmakuStore();

  let loadedRanges: TimeRange[] = [];
  const inflight = new Map<string, Promise<void>>();
  const danmakuMap = new Map<string, Danmaku>();
  let lastTickAt = 0;

  function syncStore(added: Danmaku[] = [], notifyPlugin = true) {
    const list = Array.from(danmakuMap.values()).sort(
      (a, b) => a.displayMoment - b.displayMoment,
    );
    danmakuStore.setDanmakuList(list);
    if (notifyPlugin && added.length > 0) {
      options.onDanmakuAdded?.(added);
    }
  }

  function danmakuKey(d: Danmaku): string {
    if (d.danmakuId != null && d.danmakuId !== "") {
      return String(d.danmakuId);
    }
    // 无服务端 id 时用内容指纹，避免同条本地弹幕重复插入
    return `fp:${d.displayMoment}|${d.content}|${d.color}|${d.position}`;
  }

  function mergeIntoMap(items: Danmaku[]): Danmaku[] {
    const added: Danmaku[] = [];
    for (const item of items) {
      const key = danmakuKey(item);
      if (danmakuMap.has(key)) continue;
      danmakuMap.set(key, item);
      added.push(item);
    }
    return added;
  }

  /** 插入并合并相邻/重叠半开区间 */
  function mergeRange(from: number, to: number) {
    if (from >= to) return;
    const next: TimeRange[] = [];
    let nf = from;
    let nt = to;
    let inserted = false;

    for (const r of loadedRanges) {
      if (r.to < nf) {
        next.push(r);
        continue;
      }
      if (r.from > nt) {
        if (!inserted) {
          next.push({ from: nf, to: nt });
          inserted = true;
        }
        next.push(r);
        continue;
      }
      nf = Math.min(nf, r.from);
      nt = Math.max(nt, r.to);
    }
    if (!inserted) {
      next.push({ from: nf, to: nt });
    }
    loadedRanges = next;
  }

  /**
   * 当前位置起连续已覆盖到的右端点；若 t 未覆盖则返回 t。
   */
  function contiguousCoveredUntil(t: number): number {
    for (const r of loadedRanges) {
      if (r.from <= t && t < r.to) {
        return r.to;
      }
    }
    return t;
  }

  /** desired - loaded，再切成 ≤ CHUNK_MS 的 chunk */
  function uncoveredSubranges(from: number, to: number): TimeRange[] {
    if (from >= to) return [];

    const gaps: TimeRange[] = [];
    let cursor = from;

    for (const r of loadedRanges) {
      if (r.to <= cursor) continue;
      if (r.from >= to) break;
      if (r.from > cursor) {
        gaps.push({ from: cursor, to: Math.min(r.from, to) });
      }
      cursor = Math.max(cursor, r.to);
      if (cursor >= to) break;
    }
    if (cursor < to) {
      gaps.push({ from: cursor, to });
    }

    const chunks: TimeRange[] = [];
    for (const gap of gaps) {
      let s = gap.from;
      while (s < gap.to) {
        const e = Math.min(s + CHUNK_MS, gap.to);
        chunks.push({ from: s, to: e });
        s = e;
      }
    }
    return chunks;
  }

  function clampToDuration(from: number, to: number): TimeRange | null {
    const durationMs = options.getDurationMs();
    const maxTo =
      Number.isFinite(durationMs) && durationMs > 0
        ? Math.floor(durationMs)
        : to;
    const f = Math.max(0, Math.floor(from));
    const t = Math.min(Math.floor(to), maxTo);
    if (f >= t) return null;
    return { from: f, to: t };
  }

  async function fetchChunk(from: number, to: number): Promise<void> {
    const key = `${from}-${to}`;
    const existing = inflight.get(key);
    if (existing) {
      await existing;
      return;
    }

    const task = (async () => {
      const videoId = options.getVideoId();
      if (!videoId) return;

      const list = await videoApi.loadDanmakuList(
        videoId,
        options.getFileIndex(),
        from,
        to,
      );
      // 失败不 mergeRange，留给下次 tick 重试
      if (list == null) return;

      mergeRange(from, to);
      const added = mergeIntoMap(Array.isArray(list) ? list : []);
      if (added.length > 0) {
        syncStore(added, true);
      }
    })().finally(() => {
      inflight.delete(key);
    });

    inflight.set(key, task);
    await task;
  }

  async function ensureCoverage(fromMs: number, toMs: number): Promise<void> {
    const clamped = clampToDuration(fromMs, toMs);
    if (!clamped) return;

    const chunks = uncoveredSubranges(clamped.from, clamped.to);
    if (chunks.length === 0) return;

    await Promise.all(chunks.map(c => fetchChunk(c.from, c.to)));
  }

  /**
   * 以当前时间为锚：保证 [t, t+CHUNK) 覆盖；
   * 若已覆盖但前沿不足 PREFETCH_LEAD，则再向前延伸一段。
   */
  async function onPlaybackTime(currentTimeSec: number): Promise<void> {
    const t = Math.max(0, Math.floor(currentTimeSec * 1000));
    const coveredUntil = contiguousCoveredUntil(t);

    if (coveredUntil === t) {
      // 当前位置未覆盖：锚点加载后 5s
      await ensureCoverage(t, t + CHUNK_MS);
      return;
    }

    if (coveredUntil - t < PREFETCH_LEAD_MS) {
      await ensureCoverage(coveredUntil, coveredUntil + CHUNK_MS);
    }
  }

  /** seek / 起播：以当前时间为锚点拉一段 */
  async function onSeekOrReady(currentTimeSec: number): Promise<void> {
    const t = Math.max(0, Math.floor(currentTimeSec * 1000));
    await ensureCoverage(t, t + CHUNK_MS);
    // 若已在覆盖区内且前沿不足，顺带预取
    const coveredUntil = contiguousCoveredUntil(t);
    if (coveredUntil > t && coveredUntil - t < PREFETCH_LEAD_MS) {
      await ensureCoverage(coveredUntil, coveredUntil + CHUNK_MS);
    }
  }

  /** timeupdate 节流入口 */
  function onTimeUpdate(currentTimeSec: number): void {
    const now = Date.now();
    if (now - lastTickAt < TICK_THROTTLE_MS) return;
    lastTickAt = now;
    void onPlaybackTime(currentTimeSec);
  }

  /** 用户刚发送的弹幕写入本地（插件 beforeEmit 返回 true 后已自行入队，勿再 emit） */
  function addLocalDanmaku(danmaku: Danmaku): void {
    const withPostTime: Danmaku = {
      ...danmaku,
      // 列表「发送时间」展示用；后端入库时间稍后可能不同，仅前端即时展示
      postTime: danmaku.postTime ?? new Date().toISOString(),
    };
    const added = mergeIntoMap([withPostTime]);
    if (added.length > 0) syncStore(added, false);
  }

  function reset(): void {
    loadedRanges = [];
    inflight.clear();
    danmakuMap.clear();
    lastTickAt = 0;
    danmakuStore.resetDanmakuList();
  }

  function getList(): Danmaku[] {
    return Array.from(danmakuMap.values());
  }

  return {
    ensureCoverage,
    onPlaybackTime,
    onSeekOrReady,
    onTimeUpdate,
    addLocalDanmaku,
    reset,
    getList,
    contiguousCoveredUntil,
    uncoveredSubranges,
  };
}

export type DanmakuLoader = ReturnType<typeof createDanmakuLoader>;
