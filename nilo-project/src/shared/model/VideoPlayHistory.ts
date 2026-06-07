export interface VideoPlayHistory {
  /** 用户ID */
  userId: number;

  /** 用户昵称 */
  nickName: string;

  /** 视频ID */
  videoId: string;

  /** 文件索引 */
  fileIndex: number;

  /** 最后更新时间 */
  lastUpdateTime: string;

  /** 视频封面 */
  videoCover: string;

  /** 视频名称 */
  videoName: string;
}
