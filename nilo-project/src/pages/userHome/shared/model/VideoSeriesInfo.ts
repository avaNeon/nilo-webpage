/**
 * 视频合集信息
 */
export interface VideoSeriesInfo {
  /** 合集ID */
  seriesId: string | null;
  /** 用户ID */
  userId: string | null;
  /** 合集名称 */
  seriesName: string | null;
  /** 合集描述 */
  seriesDescription: string | null;
  /** 排序序号 */
  sortIndex: number | null;
  /** 更新时间 */
  updateTime: string | null;
  /** 视频总数 */
  videoCount: number;
  /** 视频封面 */
  videoCover: string | null;
}
