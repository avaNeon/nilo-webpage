import {
  UserFilled,
  VideoPlay,
  ChatDotRound,
  ChatLineRound,
  FolderOpened,
  Money,
} from "@element-plus/icons-vue";
import { DataType } from "./DataType";
import type { Component } from "vue";

export interface StatisticsType {
  name: string;
  value: number;
  icon: Component | string;
}

/**
 * 统计类型列表（排除 FOLLOWER）。
 * 用户排在首位，其余与 nilo-project 创作中心一致。
 */
export const TypeInfo: StatisticsType[] = [
  { name: "用户", value: 0, icon: UserFilled },
  { name: "播放", value: DataType.PLAY, icon: VideoPlay },
  { name: "评论", value: DataType.COMMENT, icon: ChatDotRound },
  { name: "弹幕", value: DataType.DANMAKU, icon: ChatLineRound },
  { name: "点赞", value: DataType.LIKE, icon: "iconfont icon-like-solid" },
  { name: "收藏", value: DataType.COLLECT, icon: FolderOpened },
  { name: "投币", value: DataType.COIN, icon: Money },
];
