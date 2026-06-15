/**
 * 统计数据枚举（对应后端 DataType，排除 FOLLOWER）
 */
export const DataType = {
  /** 播放数 */
  PLAY: 2,
  /** 评论数 */
  COMMENT: 3,
  /** 弹幕数 */
  DANMAKU: 4,
  /** 点赞数 */
  LIKE: 5,
  /** 收藏数 */
  COLLECT: 6,
  /** 投币数 */
  COIN: 7,
} as const;

/** DataType 对应的中文标签 */
export const DataTypeLabel: Record<number, string> = {
  [DataType.PLAY]: "播放",
  [DataType.COMMENT]: "评论",
  [DataType.DANMAKU]: "弹幕",
  [DataType.LIKE]: "点赞",
  [DataType.COLLECT]: "收藏",
  [DataType.COIN]: "投币",
};
