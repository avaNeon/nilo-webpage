/** 助手回答里引用的视频 */
export interface AiCitedVideo {
  videoId: string;
  videoName: string;
}

/** 助手回答里引用的视频片段，点击跳到对应分 P 的对应时间 */
export interface AiCitedSegment {
  videoId: string;
  videoName: string;
  /** 第几 P，从 1 开始 */
  fileIndex: number;
  /** 从这一 P 开头算起的秒数 */
  startSec: number;
}

/** /ai/ask 的返回值 */
export interface AiAnswer {
  answer: string;
  videos: AiCitedVideo[];
  /** 回答里引用的片段；老接口不返回这个字段 */
  segments?: AiCitedSegment[];
  /** SELF_INTRO / VIDEO_SEARCH / REJECT */
  intent: string;
}
