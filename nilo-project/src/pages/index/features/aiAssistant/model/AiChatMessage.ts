import type { AiCitedVideo } from "./AiAnswer";

/** 对话框里的一条消息 */
export interface AiChatMessage {
  role: "user" | "assistant";
  content: string;
  /** 助手消息引用的视频，点击跳转到视频页 */
  videos?: AiCitedVideo[];
}
