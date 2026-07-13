export interface VideoPlayHistory {
  /** 视频作者用户ID（非历史记录所属用户） */
  userId: number | null;

  /** 视频作者昵称 */
  nickName: string | null;

  /** 视频ID */
  videoId: string;

  /** 文件索引 */
  fileIndex: number;

  /** 最后更新时间 */
  lastUpdateTime: string;

  /** 视频封面；视频已删除时为 null */
  videoCover: string | null;

  /** 视频名称；视频已删除时为 null */
  videoName: string | null;
}
