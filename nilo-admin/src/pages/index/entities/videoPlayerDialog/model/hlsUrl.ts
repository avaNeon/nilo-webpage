import { getAdminBaseUrl, Api } from "@/shared/config/Api";
import { publicHlsMasterUrl } from "@/shared/config/Minio";
import { VideoStatusEnum } from "@/pages/index/widgets/content/upload/model/enum/VideoStatusEnum";

/** 与后端 UpdateType 一致：0 无更新，1 有更新 */
const UpdateType = {
  NoUpdate: 0,
  Updated: 1,
} as const;

/**
 * 上传稿件 HLS：
 * - 待审核 + 有更新(updateType=1) → admin 鉴权代理（MinIO pending/）
 * - 待审核 + 未更新(updateType=0) → MinIO public/（二次投稿未改动的分 P 仍在公开桶）
 * - 审核通过 → MinIO public/
 * - 其余状态 → 不可播放（空串）
 */
export function getHlsMasterUrl(
  videoId: string,
  index: number = 1,
  options?: {
    status?: number | null;
    filePath?: string | null;
    updateType?: number | null;
  },
): string {
  if (!videoId) return "";

  const status = Number(options?.status);
  const filePath = options?.filePath;
  const updateType = Number(options?.updateType);

  if (status === VideoStatusEnum.PendingReview) {
    // 有更新：新转码结果在 pending，走鉴权代理
    if (updateType === UpdateType.Updated) {
      return `${getAdminBaseUrl()}${Api.hlsMaster}/${videoId}/${index}/master.m3u8`;
    }
    // 未更新：文件仍在 public（首次投稿待审时分 P 均为有更新，不会走到这里）
    return filePath ? publicHlsMasterUrl(filePath) : "";
  }

  if (status === VideoStatusEnum.Passed) {
    return filePath ? publicHlsMasterUrl(filePath) : "";
  }

  return "";
}

/** 存档 HLS（仍走 archive 代理） */
export function getArchiveHlsMasterUrl(
  videoId: string,
  index: number = 1,
): string {
  return `${getAdminBaseUrl()}${Api.archiveHlsMaster}/${videoId}/${index}/master.m3u8`;
}
