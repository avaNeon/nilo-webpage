import type { BriefUserInfo } from "./BriefUserInfo";

/**
 * 视频搜索文档信息
 */
export interface VideoInfoDoc {
  briefUserInfo: BriefUserInfo;

  videoId: string;

  videoCover: string;

  videoName: string;

  duration: number;

  lastUpdateTime: string;

  categoryNumber: string;

  tags: string[];

  playCount: number;

  danmakuCount: number;

  collectCount: number;
}
