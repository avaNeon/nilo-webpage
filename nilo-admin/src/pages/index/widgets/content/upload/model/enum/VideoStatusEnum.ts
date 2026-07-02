/**
 * 视频状态枚举
 */
export const VideoStatusEnum = {
  /** 转码中 */
  Transcoding: 0,
  /** 转码失败 */
  TranscodingFailed: 1,
  /** 待审核 */
  PendingReview: 2,
  /** 审核通过 */
  Passed: 3,
  /** 审核不通过 */
  NotPassed: 4,
} as const;

/** 视频状态数值类型 */
export type VideoStatus =
  (typeof VideoStatusEnum)[keyof typeof VideoStatusEnum];

/** 状态 → 中文文案 */
const STATUS_LABEL_MAP: Record<VideoStatus, string> = {
  [VideoStatusEnum.Transcoding]: "转码中",
  [VideoStatusEnum.TranscodingFailed]: "转码失败",
  [VideoStatusEnum.PendingReview]: "待审核",
  [VideoStatusEnum.Passed]: "已通过",
  [VideoStatusEnum.NotPassed]: "未通过",
};

/** 状态 → CSS 类名 */
const STATUS_CLASS_MAP: Record<VideoStatus, string> = {
  [VideoStatusEnum.Transcoding]: "status-transcoding",
  [VideoStatusEnum.TranscodingFailed]: "status-failed",
  [VideoStatusEnum.PendingReview]: "status-pending",
  [VideoStatusEnum.Passed]: "status-passed",
  [VideoStatusEnum.NotPassed]: "status-not-passed",
};

/**
 * 根据视频状态值获取中文文案
 * @param status 视频状态数值
 * @returns 中文描述，未知状态返回 "未知"
 */
export function getStatusLabel(status: number): string {
  return STATUS_LABEL_MAP[status as VideoStatus] ?? "未知";
}

/**
 * 根据视频状态值获取对应的 CSS 类名
 * @param status 视频状态数值
 * @returns CSS 类名，未知状态返回空字符串
 */
export function getStatusClass(status: number): string {
  return STATUS_CLASS_MAP[status as VideoStatus] ?? "";
}
