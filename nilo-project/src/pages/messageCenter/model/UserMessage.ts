/**
 * 消息扩展信息
 */
export interface ExtendJson {
  /** 主要内容 */
  mainContent: string | null;

  /** 次要内容 */
  subContent: string | null;
}

/**
 * 用户消息
 */
export interface UserMessage {
  /** 消息ID */
  messageId: string | null;

  /** 相关视频ID */
  videoId: string | null;

  /** 消息类型 */
  messageType: number | null;

  /** 发送者用户ID */
  senderUserId: string | null;

  /** 0:未读 1:已读 */
  readType: number | null;

  /** 创建时间 */
  createTime: string | null;

  /** 扩展信息 */
  extendJson: ExtendJson | null;

  /** 发送者用户昵称 */
  nickName: string | null;

  /** 发送者用户头像 */
  avatar: string | null;

  /** 视频封面 */
  videoCover: string | null;

  /** 视频名称 */
  videoName: string | null;
}
