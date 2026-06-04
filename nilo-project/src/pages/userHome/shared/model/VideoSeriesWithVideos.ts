import type { VideoInfo } from "@/shared/model/VideoInfo";

/**
 * 用户合集及其包含的视频列表
 */
export interface VideoSeriesWithVideos {
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
  videoCount: number | null;
  /** 视频列表 */
  videoInfoList: VideoInfo[] | null;
}
