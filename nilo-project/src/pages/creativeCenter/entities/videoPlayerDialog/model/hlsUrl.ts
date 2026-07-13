import { getPendingVideoResource } from "@/pages/videoDetail/features/player/api/VideoApi";
import { publicHlsMasterUrl } from "@/shared/config/Minio";

const VideoStatusEnum = {
  PendingReview: 2,
  Passed: 3,
} as const;

/**
 * 创作中心稿件 HLS：
 * - 待审核 → web 鉴权代理（MinIO pending/）
 * - 审核通过 → MinIO public/（需 filePath）
 * - 其余状态 → 不可播放（空串）
 */
export function getCreatorHlsMasterUrl(
  videoId: string,
  index: number = 1,
  options?: { status?: number | null; filePath?: string | null },
): string {
  if (!videoId) return "";

  const status = Number(options?.status);
  const filePath = options?.filePath;

  if (status === VideoStatusEnum.PendingReview) {
    return getPendingVideoResource(videoId, index);
  }

  if (status === VideoStatusEnum.Passed) {
    return filePath ? publicHlsMasterUrl(filePath) : "";
  }

  return "";
}
