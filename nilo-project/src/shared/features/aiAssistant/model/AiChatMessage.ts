import type { AiCitedSegment, AiCitedVideo } from "./AiAnswer";

/** 对话框里的一条消息 */
export interface AiChatMessage {
  role: "user" | "assistant";
  content: string;
  /** 助手消息引用的视频，点击跳转到视频页 */
  videos?: AiCitedVideo[];
  /** 助手消息引用的视频片段，点击跳到对应分 P 的对应时间 */
  segments?: AiCitedSegment[];
  /** 正文还没到时显示的进度，比如「正在查站内视频和字幕」 */
  pending?: string;
}
