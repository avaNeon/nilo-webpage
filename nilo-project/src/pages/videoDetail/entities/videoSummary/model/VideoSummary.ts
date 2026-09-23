/** 视频里的一个章节，点了跳到对应时间 */
interface VideoChapter {
  startSec: number;
  title: string;
}

/** 转码时大模型根据字幕生成的总结，存在 MinIO 的 summary.json 里 */
interface VideoSummary {
  summary: string;
  chapters?: VideoChapter[];
}

export type { VideoChapter, VideoSummary };
