import type { VideoPlayHistory } from "@/shared/model/VideoPlayHistory";
import type { VideoInfo } from "@/shared/model/VideoInfo";

export interface VideoHistoryItem {
  history: VideoPlayHistory;
  videoInfo: VideoInfo;
  /** 关联视频已从 video_info 移除（封面/标题均为空） */
  deleted: boolean;
}
