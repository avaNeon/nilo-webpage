import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { VideoManagementApi } from "../api/VideoManagementApi";
import type { VideoUploadInfo } from "./VideoUploadInfo";
import type { VideoStatusCount } from "./VideoStatusCount";
import {
  hasInteractionFlag,
  InteractionFlag,
  toggleInteractionFlag,
  type InteractionFlagValue,
} from "./videoWork";
import message from "@/shared/lib/message";
import confirm from "@/shared/lib/confirm";

/* ─── 状态标签 ─────────────────────────────────────────────── */

/**
 * all 全部；ing 进行中（转码中 / 转码失败 / 待审核）；ok 已通过；no 未通过
 * 同时也是地址栏 ?status= 的取值（投稿成功页跳到 /cc/video?status=ing）
 */
export type WorksTab = "all" | "ing" | "ok" | "no";

const WORKS_TABS: readonly WorksTab[] = ["all", "ing", "ok", "no"];

const TAB_LABELS: Record<WorksTab, string> = {
  all: "全部",
  ing: "进行中",
  ok: "已通过",
  no: "未通过",
};

/** 每页固定 10 条 */
export const PAGE_SIZE = 10;

function parseWorksTab(value: unknown): WorksTab {
  const raw = Array.isArray(value) ? value[0] : value;
  return WORKS_TABS.find(tab => tab === raw) ?? "all";
}

/**
 * 将标签映射到后端 status 参数
 *   all → undefined（不传，查询全部）
 *   ing → -1（进行中）
 *   ok  →  3（已通过）
 *   no  →  4（未通过）
 */
function getStatusParam(tab: WorksTab): number | undefined {
  switch (tab) {
    case "ing":
      return -1;
    case "ok":
      return 3;
    case "no":
      return 4;
    case "all":
    default:
      return undefined;
  }
}

function getTabCount(tab: WorksTab, counts: VideoStatusCount): number {
  switch (tab) {
    case "ing":
      return counts.pendingCount;
    case "ok":
      return counts.completedCount;
    case "no":
      return counts.failedCount;
    case "all":
    default:
      return counts.pendingCount + counts.completedCount + counts.failedCount;
  }
}

/* ─── Composable ───────────────────────────────────────────── */

export function useVideoManagement() {
  const route = useRoute();
  const router = useRouter();
  /** 离开本页时 route 会先变，watch 要跳过别的页面 */
  const ownRouteName = route.name;

  /* 状态 */
  const activeTab = ref<WorksTab>(parseWorksTab(route.query.status));

  /** 输入框里的内容 */
  const searchKeyword = ref<string>("");
  /** 真正用于查询的关键字（防抖结束或回车后才更新） */
  const appliedKeyword = ref<string>("");

  /** 各状态数量（跟随搜索），第一次请求回来前为 null */
  const videoCounts = ref<VideoStatusCount | null>(null);

  const videoList = ref<VideoUploadInfo[]>([]);
  /** 第一次列表请求回来前不显示空状态 */
  const listLoaded = ref(false);
  const listLoading = ref(false);

  /** 当前页，从 1 开始 */
  const currentPage = ref(1);

  /** 标题旁的总数 = 各状态数量之和 */
  const allCount = computed<number | null>(() =>
    videoCounts.value ? getTabCount("all", videoCounts.value) : null,
  );

  const tabOptions = computed(() =>
    WORKS_TABS.map(tab => ({
      label: TAB_LABELS[tab],
      value: tab,
      count: videoCounts.value ? getTabCount(tab, videoCounts.value) : null,
    })),
  );

  /** 当前标签对应的视频总数（列表接口不返回总数） */
  const totalCount = computed(() =>
    videoCounts.value ? getTabCount(activeTab.value, videoCounts.value) : 0,
  );

  /* 请求：只认最后一次发出的，避免快速切换时旧结果覆盖新结果 */

  let countsRequestId = 0;
  let listRequestId = 0;

  async function loadVideoCounts() {
    const requestId = ++countsRequestId;
    const result = await VideoManagementApi.getVideoStatusCount(
      appliedKeyword.value === "" ? undefined : appliedKeyword.value,
    );
    if (requestId !== countsRequestId) return;
    if (result) {
      videoCounts.value = result;
    }
  }

  async function loadVideos() {
    const requestId = ++listRequestId;
    listLoading.value = true;
    const result = await VideoManagementApi.loadVideoList(
      getStatusParam(activeTab.value),
      currentPage.value,
      PAGE_SIZE,
      appliedKeyword.value === "" ? undefined : appliedKeyword.value,
    );
    if (requestId !== listRequestId) return;
    videoList.value = result ?? [];
    listLoaded.value = true;
    listLoading.value = false;
  }

  /** 回到第一页，重新请求数量和列表 */
  function reload() {
    currentPage.value = 1;
    loadVideoCounts();
    loadVideos();
  }

  /* 标签：和地址栏 ?status= 同步，刷新后停在同一个标签 */

  watch(
    () => route.query.status,
    value => {
      if (route.name !== ownRouteName) return;
      activeTab.value = parseWorksTab(value);
    },
  );

  watch(activeTab, tab => {
    if (route.name === ownRouteName && parseWorksTab(route.query.status) !== tab) {
      const query = { ...route.query };
      if (tab === "all") {
        delete query.status;
      } else {
        query.status = tab;
      }
      router.replace({ query });
    }
    reload();
  });

  /* 搜索：输入停下 1 秒自动搜，回车或点放大镜立即搜 */

  let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  function clearSearchTimer() {
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = null;
    }
  }

  function search(keyword: string = searchKeyword.value) {
    clearSearchTimer();
    appliedKeyword.value = keyword.trim();
    reload();
  }

  watch(searchKeyword, () => {
    clearSearchTimer();
    searchDebounceTimer = setTimeout(() => search(), 1000);
  });

  /* 翻页 */

  function changePage(page: number) {
    currentPage.value = page;
    // 回到页面最顶端
    window.scrollTo(0, 0);
    loadVideos();
  }

  /* 弹幕 / 评论开关 */

  /** 同一稿件请求没回来前不再发，免得两次请求用同一份旧设置互相覆盖 */
  const interactionBusy = new Set<string>();
  /** 同一个开关 0.5 秒内只响应一次 */
  const interactionCooldown = new Set<string>();

  async function toggleInteraction(video: VideoUploadInfo, flag: InteractionFlagValue) {
    const videoId = video.videoId;
    if (!videoId) return;
    const cooldownKey = `${videoId}:${flag}`;
    if (interactionBusy.has(videoId) || interactionCooldown.has(cooldownKey)) return;

    interactionBusy.add(videoId);
    interactionCooldown.add(cooldownKey);
    setTimeout(() => interactionCooldown.delete(cooldownKey), 500);

    const currentlyClosed = hasInteractionFlag(video.interaction, flag);
    const nextInteraction = toggleInteractionFlag(video.interaction, flag);
    try {
      const ok = await VideoManagementApi.setInteraction(videoId, nextInteraction);
      if (!ok) return;
      video.interaction = nextInteraction;
      const target = flag === InteractionFlag.DanmakuClosed ? "弹幕" : "评论";
      message.success(`${currentlyClosed ? "已开启" : "已关闭"}${target}`);
    } finally {
      interactionBusy.delete(videoId);
    }
  }

  /* 删除 */

  function deleteVideo(video: VideoUploadInfo) {
    const videoId = video.videoId;
    if (!videoId) return;
    confirm({
      message: `确定要删除「${video.videoName || "该视频"}」吗？删除后可能会无法恢复。`,
      confirmText: "删除",
      confirmFun: async () => {
        const result = await VideoManagementApi.deleteVideo(videoId, "用户主动删除");
        if (result === null || result.code !== 200) return;
        message.success("视频已删除");
        videoList.value = videoList.value.filter(v => v.videoId !== videoId);
        // 这一页删空了就回到上一页；重新请求当前页，把后面的稿件补上来
        if (videoList.value.length === 0 && currentPage.value > 1) {
          currentPage.value -= 1;
        }
        loadVideoCounts();
        loadVideos();
      },
    });
  }

  /* 生命周期 */

  onMounted(() => {
    loadVideoCounts();
    loadVideos();
  });

  onBeforeUnmount(clearSearchTimer);

  return {
    // 状态
    activeTab,
    tabOptions,
    allCount,
    totalCount,
    searchKeyword,
    appliedKeyword,
    videoList,
    listLoaded,
    listLoading,
    currentPage,
    // 方法
    search,
    changePage,
    toggleInteraction,
    deleteVideo,
  };
}
