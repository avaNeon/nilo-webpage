/** 助手回答里引用的视频 */
export interface AiCitedVideo {
  videoId: string;
  videoName: string;
}

/** /ai/ask 的返回值 */
export interface AiAnswer {
  answer: string;
  videos: AiCitedVideo[];
  /** SELF_INTRO / VIDEO_SEARCH / REJECT */
  intent: string;
}
