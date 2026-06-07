import type { VideoPlayHistory } from "@/shared/model/VideoPlayHistory";
import type { VideoInfo } from "@/shared/model/VideoInfo";

export interface VideoHistoryItem {
  history: VideoPlayHistory;
  videoInfo: VideoInfo;
}
