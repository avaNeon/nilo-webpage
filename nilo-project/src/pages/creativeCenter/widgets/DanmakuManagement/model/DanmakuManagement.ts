/**
 * 弹幕管理信息
 */
export interface DanmakuManagement {
  /** 弹幕ID */
  danmakuId: string | null;

  /** 视频ID */
  videoId: string | null;

  /** 视频文件序号 */
  fileIndex: number | null;

  /** 用户ID */
  userId: string | null;

  /** 发布时间 */
  postTime: string | null;

  /** 内容 */
  content: string | null;

  /** 展示位置 */
  position: number | null;

  /** 颜色(HEX+不透明度) */
  color: string | null;

  /** 展示时刻（单位：毫秒） */
  displayMoment: number | null;

  /** 用户名 */
  nickName: string | null;

  /** 视频名称 */
  videoName: string | null;
}
