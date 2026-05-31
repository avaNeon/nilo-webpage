import { nextTick, onMounted, reactive, ref, useTemplateRef } from "vue";
import type { StatisticsInfo } from "./StatisticsInfo";
import { CcHomeApi } from "../api/CcHomeApi";
import { DataType, isDataType } from "./DataType";
import type { ECharts } from "echarts";
import * as echarts from "echarts";
import { TypeInfo } from "./TypeInfo";

export function useCcHome() {
  /* ——————————————数据源—————————————— */

  const statisticsList = reactive<StatisticsInfo[]>([]);

  /* —————————————响应式状态———————————— */

  const currentDataType = ref<DataType>(DataType.FOLLOWER);

  const chartRef = useTemplateRef<HTMLDivElement>("chartRef");

  /* —————————————显示实例———————————— */

  let chart: ECharts | null = null;

  /* ——————————————功能函数—————————————— */

  /**
   * 切换数据类型
   * @param dataType 数据类型
   */
  function changeDataType(dataType: number) {
    if (isDataType(dataType)) {
      currentDataType.value = dataType;
      loadChart(dataType);
    }
  }

  /**
   * 合计单个类型的近期统计数据
   */
  function summarizeStatistics(dataType: number): number | null {
    if (isDataType(dataType)) {
      return statisticsList
        .filter(item => item.dataType === dataType)
        .reduce((sum, { statisticsCount }) => sum + (statisticsCount ?? 0), 0);
    } else {
      return null;
    }
  }

  /* ——————————————初始化函数———————————— */

  /**
   * 加载近期统计数据
   */
  async function loadStatistics() {
    const result = await CcHomeApi.loadRecentStatisticsInfo();
    if (result != null) {
      statisticsList.push(...result);
    }
  }

  /**
   * 加载图表
   */
  async function loadChart(dataType: number) {
    if (!chartRef.value) {
      return;
    }

    if (!chart) {
      chart = echarts.init(chartRef.value);
    }

    if (isDataType(dataType)) {
      /** 当前分类的数据 */
      const currentTypeList = statisticsList.filter(
        item => item.dataType === dataType,
      );

      /** 近7天的日期 */
      const dateList = currentTypeList
        .map(item => item.statisticsDate)
        .filter(item => item !== null)
        .sort();

      chart.setOption({
        // X轴
        xAxis: {
          type: "category",
          data: dateList,
        },
        // Y轴
        yAxis: {
          type: "value",
        },
        // 折线
        series: [
          {
            name: TypeInfo.find(item => item.value === dataType)?.name,
            type: "line",
            data: currentTypeList.map(item => item.statisticsCount),
            // 折线平滑
            smooth: true,
            symbol: "circle",
            symbolSize: 6,
            lineStyle: {
              color: "#00aeec",
              width: 3,
            },
            itemStyle: {
              color: "#00aeec",
            },
            areaStyle: {
              color: "rgba(0, 174, 236, 0.15)",
            },
          },
        ],
        // 图例文字标注
        legend: {
          top: 0,
        },
        // 鼠标悬浮提示
        tooltip: {
          trigger: "axis",
        },
        // 图表边距
        grid: {
          left: 40,
          right: 20,
          top: 45,
          bottom: 30,
        },
      });
    }
  }

  onMounted(async () => {
    // 先加载统计数据
    await loadStatistics();
    await nextTick();
    loadChart(currentDataType.value);
  });

  return {
    statisticsList,
    currentDataType,
    changeDataType,
    summarizeStatistics,
  };
}
