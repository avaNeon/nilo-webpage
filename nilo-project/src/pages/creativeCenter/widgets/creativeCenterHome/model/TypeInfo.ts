import { DataType } from "./DataType";

export interface statisticsType {
  name: string;
  value: DataType;
  /** 是否有累计总数；收藏、投币没有接口能拿到总数，只展示近 7 日新增 */
  hasTotal: boolean;
}

export const TypeInfo: statisticsType[] = [
  { name: "关注", value: DataType.FOLLOWER, hasTotal: true },
  { name: "播放", value: DataType.PLAY, hasTotal: true },
  { name: "评论", value: DataType.COMMENT, hasTotal: true },
  { name: "弹幕", value: DataType.DANMAKU, hasTotal: true },
  { name: "点赞", value: DataType.LIKE, hasTotal: true },
  { name: "收藏", value: DataType.COLLECT, hasTotal: false },
  { name: "投币", value: DataType.COIN, hasTotal: false },
];
