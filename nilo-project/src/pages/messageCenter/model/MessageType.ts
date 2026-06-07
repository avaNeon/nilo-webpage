/**
 * 消息类型
 *
 * - SYSTEM  = 1（系统消息）
 * - LIKE    = 2（点赞消息）
 * - COLLECT = 3（收藏消息）
 * - COMMENT = 4（评论消息）
 */
export const MessageType = {
  SYSTEM: 1 as const,
  LIKE: 2 as const,
  COLLECT: 3 as const,
  COMMENT: 4 as const,
} as const;

/** 消息类型数值 */
export type MessageTypeValue = (typeof MessageType)[keyof typeof MessageType];
