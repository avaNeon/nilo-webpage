/**
 * 统计数据
 */
export interface StatisticsInfo {
  /** 统计日期 */
  statisticsDate: string | null;

  /** 数据统计类型 */
  dataType: number | null;

  /** 统计数量 */
  statisticsCount: number | null;
}
