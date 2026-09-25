import { computed, onMounted, reactive, ref } from "vue";
import dayjs from "dayjs";
import { CcHomeApi } from "../api/CcHomeApi";
import { DataType } from "./DataType";
import { TypeInfo } from "./TypeInfo";
import { useLoginStateStore } from "@/shared/store/LoginStateStore";
import { formatCount } from "@/shared/utils/NumberUtil";

/** 图表、7 日合计、日期范围都按连续 7 天算 */
const DAY_COUNT = 7;
const DAY_FORMAT = "YYYY-MM-DD";

/** 整理后的单日统计 */
interface DailyCount {
  /** 统计日期 YYYY-MM-DD */
  day: string;
  dataType: number;
  count: number;
}

/** 统计卡片展示用数据 */
export interface StatCard {
  name: string;
  value: DataType;
  /** 大号数字：累计总数；收藏、投币没有总数，放近 7 日新增 */
  main: string;
  /** 下面一行小字 */
  sub: string;
}

/** 图表上的一天 */
export interface DailyPoint {
  /** YYYY-MM-DD */
  date: string;
  value: number;
}

/**
 * 卡片大号数字：1000 万以上不带小数（1172万），否则「1172.4万」在窄卡片里会被截断，把单位挤掉
 */
function formatCardCount(n: number): string {
  if (n >= 1e7 && n < 1e8) {
    const wan = Math.round(n / 1e4);
    // 四舍五入后凑满 1 亿的，交给 formatCount 进位
    if (wan < 1e4) return `${wan}万`;
  }
  return formatCount(n);
}

/**
 * 统计日期只取年月日，统一成 YYYY-MM-DD；解析不了返回 null
 * 后端一般给 "2026-09-24" 这样的字符串，也兼容带时间的字符串和时间戳
 */
function toDay(value: string | number | null): string | null {
  if (value === null || value === "") return null;
  const match =
    typeof value === "string"
      ? /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/.exec(value.trim())
      : null;
  const day = match
    ? dayjs(new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
    : dayjs(value);
  return day.isValid() ? day.format(DAY_FORMAT) : null;
}

export function useCcHome() {
  const loginStateStore = useLoginStateStore();

  /* ——————————————数据源—————————————— */

  /** 近期每日统计 */
  const dailyCounts = ref<DailyCount[]>([]);

  /** 近期统计是否已加载完（失败也算，按 0 展示） */
  const statisticsLoaded = ref(false);

  /** 播放、评论、弹幕、点赞的累计总数；没有值表示还在加载或没拿到 */
  const totals = reactive<Partial<Record<DataType, number | null>>>({});

  /* —————————————响应式状态———————————— */

  const currentDataType = ref<DataType>(DataType.FOLLOWER);

  /* ——————————————派生数据—————————————— */

  /**
   * 近 7 天：统计不含今天，默认以昨天为最后一天；数据里要是有更晚的日期（比如含今天）就以它为准。
   * 不能只看数据里最晚的日期：后端可能不返回 0 的行，最近没动静的账号窗口会往前错位
   */
  const recentDays = computed<string[]>(() => {
    const yesterday = dayjs().subtract(1, "day").format(DAY_FORMAT);
    const latest = dailyCounts.value.reduce<string>(
      (max, { day }) => (day > max ? day : max),
      yesterday,
    );
    const end = dayjs(latest);
    return Array.from({ length: DAY_COUNT }, (_, i) =>
      end.subtract(DAY_COUNT - 1 - i, "day").format(DAY_FORMAT),
    );
  });

  /** 标题右侧的日期范围：和图表横轴是同一段 7 天，统计加载完就显示 */
  const dateRangeText = computed(() => {
    if (!statisticsLoaded.value) return "";
    const days = recentDays.value;
    return `${days[0]} — ${days[days.length - 1]}`;
  });

  /** 每个类型近 7 天的每日新增，缺的日子补 0 */
  const dailySeries = computed(() => {
    const dayIndex = new Map(recentDays.value.map((day, i) => [day, i]));
    const series = new Map<number, number[]>(
      TypeInfo.map(type => [type.value, new Array<number>(DAY_COUNT).fill(0)]),
    );
    for (const { day, dataType, count } of dailyCounts.value) {
      const index = dayIndex.get(day);
      const list = series.get(dataType);
      if (index !== undefined && list) {
        list[index] = (list[index] ?? 0) + count;
      }
    }
    return series;
  });

  function seriesOf(dataType: DataType): number[] {
    return (
      dailySeries.value.get(dataType) ?? new Array<number>(DAY_COUNT).fill(0)
    );
  }

  /** 近 7 日合计 */
  function weekSumOf(dataType: DataType): number {
    return seriesOf(dataType).reduce((sum, count) => sum + count, 0);
  }

  /** 累计总数：关注取登录时拿到的粉丝数，其余取接口结果 */
  function totalOf(dataType: DataType): number | null {
    if (dataType === DataType.FOLLOWER) {
      return loginStateStore.followerCount;
    }
    return totals[dataType] ?? null;
  }

  const statCards = computed<StatCard[]>(() =>
    TypeInfo.map(type => {
      const weekText = statisticsLoaded.value
        ? "+" + formatCount(weekSumOf(type.value))
        : "—";
      if (!type.hasTotal) {
        return {
          name: type.name,
          value: type.value,
          main: weekText,
          sub: "近 7 日新增",
        };
      }
      const total = totalOf(type.value);
      return {
        name: type.name,
        value: type.value,
        main: total === null ? "—" : formatCardCount(total),
        sub: `7日 ${weekText}`,
      };
    }),
  );

  const currentTypeName = computed(
    () => TypeInfo.find(type => type.value === currentDataType.value)?.name ?? "",
  );

  /** 当前类型的图表数据 */
  const chartPoints = computed<DailyPoint[]>(() => {
    const series = seriesOf(currentDataType.value);
    return recentDays.value.map((date, i) => ({ date, value: series[i] ?? 0 }));
  });

  /** 当前类型的 7 日合计 */
  const chartSumText = computed(() =>
    statisticsLoaded.value ? formatCount(weekSumOf(currentDataType.value)) : "—",
  );

  /* ——————————————功能函数—————————————— */

  /**
   * 切换数据类型
   * @param dataType 数据类型
   */
  function changeDataType(dataType: DataType) {
    currentDataType.value = dataType;
  }

  /* ——————————————初始化函数———————————— */

  /**
   * 加载近期统计数据
   */
  async function loadStatistics() {
    const result = await CcHomeApi.loadRecentStatisticsInfo();
    const list = Array.isArray(result) ? result : [];
    dailyCounts.value = list.flatMap(item => {
      const day = toDay(item.statisticsDate);
      // 后端 Long 可能是字符串，统一转成数字
      const dataType = Number(item.dataType);
      if (day === null || item.dataType === null || !Number.isFinite(dataType)) {
        return [];
      }
      return [{ day, dataType, count: Number(item.statisticsCount) || 0 }];
    });
    statisticsLoaded.value = true;
  }

  /**
   * 加载累计总数：三个请求并行，各自回来各自显示
   */
  function loadTotals() {
    const userId = loginStateStore.userInfo?.userId;
    if (userId) {
      CcHomeApi.loadPlayAndLikeTotal(userId).then(result => {
        totals[DataType.PLAY] = result?.playCount ?? null;
        totals[DataType.LIKE] = result?.likeCount ?? null;
      });
    }
    CcHomeApi.loadCommentTotal().then(count => {
      totals[DataType.COMMENT] = count;
    });
    CcHomeApi.loadDanmakuTotal().then(count => {
      totals[DataType.DANMAKU] = count;
    });
  }

  onMounted(async () => {
    // 先加载近期统计，再补累计总数
    await loadStatistics();
    loadTotals();
  });

  return {
    currentDataType,
    statCards,
    dateRangeText,
    currentTypeName,
    chartPoints,
    chartSumText,
    changeDataType,
  };
}
