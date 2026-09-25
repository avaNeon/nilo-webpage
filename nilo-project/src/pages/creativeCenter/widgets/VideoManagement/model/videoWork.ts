import type { VideoUploadInfo } from "./VideoUploadInfo";
import type { VideoInfo } from "@/shared/model/VideoInfo";

/* ─── 稿件状态 ─────────────────────────────────────────────── */

/** 0:转码中 1:转码失败 2:待审核 3:已通过 4:未通过 */
export const VideoStatus = {
  Transcoding: 0,
  TranscodingFailed: 1,
  PendingReview: 2,
  Passed: 3,
  NotPassed: 4,
} as const;

export interface VideoStatusMeta {
  /** 右侧状态胶囊 */
  label: string;
  tone: "ing" | "ok" | "no";
  /** 没通过审核时代替数据行的说明（已通过显示数据，为空） */
  hint: string;
  /** 说明用红字（需要用户处理） */
  danger: boolean;
}

export const VIDEO_STATUS_META: Record<0 | 1 | 2 | 3 | 4, VideoStatusMeta> = {
  0: { label: "转码中", tone: "ing", hint: "转码中，完成后会进入审核", danger: false },
  1: { label: "转码失败", tone: "no", hint: "转码失败，请重新上传转码失败的文件", danger: true },
  2: { label: "待审核", tone: "ing", hint: "正在审核中，通过后数据开始统计", danger: false },
  3: { label: "已通过", tone: "ok", hint: "", danger: false },
  4: { label: "未通过", tone: "no", hint: "未通过审核，请修改后重新上传", danger: false },
};

/** 转码失败、已通过、未通过的稿件可以编辑（重新投稿） */
export function canEditVideo(video: VideoUploadInfo): boolean {
  return (
    !!video.videoId &&
    (video.status === VideoStatus.TranscodingFailed ||
      video.status === VideoStatus.Passed ||
      video.status === VideoStatus.NotPassed)
  );
}

/* ─── 互动设置 ─────────────────────────────────────────────── */

/** interaction 是逗号分隔的集合："0" 关闭弹幕，"1" 关闭评论 */
export const InteractionFlag = {
  DanmakuClosed: "0",
  CommentClosed: "1",
} as const;

export type InteractionFlagValue = (typeof InteractionFlag)[keyof typeof InteractionFlag];

function parseInteraction(interaction: string | null): Set<string> {
  return new Set(
    (interaction ?? "").split(",").map(v => v.trim()).filter(Boolean),
  );
}

export function hasInteractionFlag(
  interaction: string | null,
  flag: InteractionFlagValue,
): boolean {
  return parseInteraction(interaction).has(flag);
}

/** 开关某一项，返回提交给后端的完整集合（"" / "0" / "1" / "0,1"） */
export function toggleInteractionFlag(
  interaction: string | null,
  flag: InteractionFlagValue,
): string {
  const flags = parseInteraction(interaction);
  if (flags.has(flag)) {
    flags.delete(flag);
  } else {
    flags.add(flag);
  }
  return [...flags].sort().join(",");
}

/* ─── 转换函数 ─────────────────────────────────────────────── */

/**
 * 将 VideoUploadInfo 转换为 VideoInfo（编辑稿件时放进 VideoUploadEditStore）
 *
 * 字段映射说明：
 *   - parentCategoryNumber → pCategoryNumber（重命名）
 *   - tags: string | null  → tags: string[] | null（按逗号分割）
 *   - userId / recommendType → 丢弃（VideoInfo 无对应字段）
 *   - briefUserInfo / userInfo → null（VideoUploadInfo 不包含用户详情）
 */
export function toVideoInfo(src: VideoUploadInfo): VideoInfo {
  return {
    videoId: src.videoId,
    videoCover: src.videoCover,
    videoName: src.videoName,
    briefUserInfo: null,
    userInfo: null,
    createTime: src.createTime,
    lastUpdateTime: src.lastUpdateTime,
    pCategoryNumber: src.parentCategoryNumber,
    categoryNumber: src.categoryNumber,
    postType: src.postType,
    originInfo: src.originInfo,
    tags: src.tags ? src.tags.split(",").map(t => t.trim()) : null,
    introduction: src.introduction,
    interaction: src.interaction,
    duration: src.duration,
    playCount: src.playCount,
    likeCount: src.likeCount,
    danmakuCount: src.danmakuCount,
    commentCount: src.commentCount,
    coinCount: src.coinCount,
    collectCount: src.collectCount,
    status: src.status,
  };
}
