/**
 * 用户未读消息数量
 */
export interface UserMessageCount {
  /** 系统消息数量 */
  systemMessageCount: number | null;

  /** 点赞消息数量 */
  likeMessageCount: number | null;

  /** 收藏消息数量 */
  collectMessageCount: number | null;

  /** 评论消息数量 */
  commentMessageCount: number | null;
}
