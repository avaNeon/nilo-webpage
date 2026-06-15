import {
  computed,
  nextTick,
  onMounted,
  reactive,
  ref,
  useTemplateRef,
} from "vue";
import dayjs from "dayjs";
import type { ECharts, EChartsOption } from "echarts";
import * as echarts from "echarts";
import { GlobalStatisticsApi } from "@/pages/index/widgets/home/api/GlobalStatisticsApi";
import type { StatisticsInfo } from "@/pages/index/widgets/home/model/StatisticsInfo";
import type { UserStat } from "@/pages/index/widgets/home/model/UserStat";
import { DataTypeLabel } from "@/pages/index/widgets/home/model/DataType";

/** 用户类型的特殊标识（不在 DataType 枚举中） */
const USER_TYPE = 0;

export function useHome() {
  /* ——————————————数据源—————————————— */

  /** 近期统计数据（播放/评论/弹幕/点赞/收藏/投币，近7天不含今天） */
  const statisticsList = reactive<StatisticsInfo[]>([]);

  /** 用户注册统计数据（按日期范围查询） */
  const userStatList = reactive<UserStat[]>([]);

  /** 加载近期统计数据 */
  async function loadRecentStatistics() {
    const result = await GlobalStatisticsApi.loadRecentStatisticsInfo();
    if (result) {
      statisticsList.length = 0;
      statisticsList.push(...result);
    }
  }

  /** 查询指定日期范围内的用户注册数据 */
  async function loadUserStat() {
    const result = await GlobalStatisticsApi.getUserStatByDatePeriod(
      startDate.value,
      endDate.value,
    );
    if (result) {
      userStatList.length = 0;
      userStatList.push(...result);
    }
  }

  // 用户日期范围
  const startDate = ref(dayjs().subtract(7, "day").format("YYYY-MM-DD"));
  const endDate = ref(dayjs().subtract(1, "day").format("YYYY-MM-DD"));

  /** 用户日期是否合法 */
  const isUserDateValid = computed(() => {
    const start = startDate.value;
    const end = endDate.value;

    if (!start || !end) return false;
    return start <= end;
  });

  /** 用户日期确认按钮回调 */
  async function onUserDateConfirm() {
    if (!isUserDateValid.value) return;
    await loadUserStat();
    loadChart(USER_TYPE);
  }

  /* —————————————图表———————————— */

  const chartRef = useTemplateRef<HTMLDivElement>("chartRef");
  let chart: ECharts | null = null;

  // 当前选中类型
  const currentDataType = ref<number>(USER_TYPE);

  /** 切换数据类型并重新渲染图表 */
  function changeDataType(value: number) {
    currentDataType.value = value;
    loadChart(value);
  }

  /** 合计指定类型的数量（用于卡片展示） */
  function summarizeStatistics(dataType: number): number {
    if (dataType === USER_TYPE) {
      return userStatList.reduce((sum, item) => sum + (item.count ?? 0), 0);
    }
    return statisticsList
      .filter(item => item.dataType === dataType)
      .reduce((sum, item) => sum + (item.statisticsCount ?? 0), 0);
  }

  /** 图表渲染 */
  async function loadChart(dataType: number) {
    if (!chartRef.value) return;
    if (!chart) {
      chart = echarts.init(chartRef.value);
    }

    let dateList: string[] = [];
    let dataList: number[] = [];
    let seriesName = "";

    if (dataType === USER_TYPE) {
      const sorted = [...userStatList].sort((a, b) =>
        (a.date ?? "").localeCompare(b.date ?? ""),
      );
      dateList = sorted.map(item => item.date ?? "");
      dataList = sorted.map(item => item.count ?? 0);
      seriesName = "用户注册";
    } else {
      const sorted = statisticsList
        .filter(item => item.dataType === dataType && item.statisticsDate)
        .sort((a, b) =>
          (a.statisticsDate ?? "").localeCompare(b.statisticsDate ?? ""),
        );
      dateList = sorted.map(item => item.statisticsDate ?? "");
      dataList = sorted.map(item => item.statisticsCount ?? 0);
      seriesName = DataTypeLabel[dataType] ?? "";
    }

    const option: EChartsOption = {
      xAxis: {
        type: "category",
        data: dateList,
        axisLabel: { color: "#666" },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: "#666" },
      },
      series: [
        {
          name: seriesName,
          type: "line",
          data: dataList,
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          lineStyle: { color: "#00aeec", width: 3 },
          itemStyle: { color: "#00aeec" },
          areaStyle: { color: "rgba(0, 174, 236, 0.15)" },
        },
      ],
      legend: { top: 0 },
      tooltip: { trigger: "axis" },
      grid: { left: 40, right: 20, top: 45, bottom: 30 },
    };

    chart.setOption(option);
  }

  /* ——————————————图表初始化—————————————— */

  onMounted(async () => {
    await Promise.all([loadRecentStatistics(), loadUserStat()]);
    await nextTick();
    loadChart(currentDataType.value);
  });

  return {
    startDate,
    endDate,
    isUserDateValid,
    currentDataType,
    changeDataType,
    summarizeStatistics,
    onUserDateConfirm,
  };
}
