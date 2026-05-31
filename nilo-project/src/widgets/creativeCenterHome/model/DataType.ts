/**
 * 数据统计类型枚举
 */
export const DataType = {
  FOLLOWER: 1,
  PLAY: 2,
  COMMENT: 3,
  DANMAKU: 4,
  LIKE: 5,
  COLLECT: 6,
  COIN: 7,
} as const;

/** DataType 字面量联合类型：1 | 2 | 3 | 4 | 5 | 6 | 7 */
export type DataType = (typeof DataType)[keyof typeof DataType];

/** 类型守卫 */
export function isDataType(value: any): value is DataType {
  return Object.values(DataType).includes(value);
}
