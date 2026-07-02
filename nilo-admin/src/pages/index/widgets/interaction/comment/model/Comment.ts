/** 评论信息 */
export interface Comment {
  /** 评论ID */
  commentId: string;

  /** 用户ID */
  userId: string;

  /** 回复用户ID */
  replyUserId: string;

  /** 评论内容 */
  content: string;

  /** 图片路径 */
  imgPaths: string;

  /** 发布时间 */
  postTime: string;

  /** 视频ID */
  videoId: string;

  /** 逻辑删除标记：0-未删除，1-已删除 */
  deleted: number;

  /** 视频名称 */
  videoName: string;

  /** 视频封面 */
  videoCover: string;

  /** 用户昵称 */
  nickName: string;

  /** 回复用户昵称 */
  replyNickName: string;

  /** 头像路径 */
  avatar: string;
}
