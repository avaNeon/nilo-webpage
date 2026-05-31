/**
 * 评论管理信息视图对象
 */
export interface CommentManagement {
  /** 评论ID */
  commentId: string | null;

  /** 用户ID */
  userId: string | null;

  /** 回复目标用户ID */
  replyUserId: string | null;

  /** 评论内容 */
  content: string | null;

  /** 图片路径 */
  imgPaths: string | null;

  /** 发布时间 */
  postTime: string | null;

  /** 视频ID */
  videoId: string | null;

  /** 视频名称 */
  videoName: string | null;

  /** 视频封面 */
  videoCover: string | null;

  /** 用户昵称 */
  nickName: string | null;

  /** 回复目标用户昵称 */
  replyNickName: string | null;

  /** 用户头像 */
  avatar: string | null;
}
