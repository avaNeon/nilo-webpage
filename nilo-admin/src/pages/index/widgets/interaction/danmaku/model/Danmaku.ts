/** 弹幕管理信息 */
export interface Danmaku {
  /** 弹幕ID */
  danmakuId: string;

  /** 视频ID */
  videoId: string;

  /** 视频文件序号 */
  fileIndex: number;

  /** 用户ID */
  userId: string;

  /** 发布时间 */
  postTime: string;

  /** 内容 */
  content: string;

  /** 展示位置 */
  position: number;

  /** 颜色（HEX+不透明度） */
  color: string;

  /** 展示时刻（单位：毫秒） */
  displayMoment: number;

  /** 用户名 */
  nickName: string;

  /** 视频名称 */
  videoName: string;
}
