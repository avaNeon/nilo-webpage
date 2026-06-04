/**
 * 合集中的视频信息
 */
export interface VideoSeriesVideo {
  /** 视频ID */
  videoId: string | null;
  /** 视频封面 */
  videoCover: string | null;
  /** 视频名称 */
  videoName: string | null;
  /** 持续时间（秒） */
  duration: number | null;
  /** 播放数量 */
  playCount: number | null;
  /** 弹幕数量 */
  danmakuCount: number | null;
  /** 最后更新时间 */
  lastUpdateTime: string | null;
  /** 父级分类编码 */
  pCategoryNumber: string | null;
  /** 分类编码 */
  categoryNumber: string | null;
  /** 合集ID */
  seriesId: string | null;
}
