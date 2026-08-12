import { getAdminBaseUrl, Api } from "@/shared/config/Api";
import { publicHlsMasterUrl } from "@/shared/config/Minio";
import { VideoStatusEnum } from "@/pages/index/widgets/content/upload/model/enum/VideoStatusEnum";

/**
 * 上传稿件 HLS：
 * - 待审核 → admin 鉴权代理（MinIO pending/）
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
  if (status === VideoStatusEnum.PendingReview) {
    // 与主站创作中心一致：待审核资源一律走后端代理，playlist 会重写为 pending 预签名 TS URL。
    return `${getAdminBaseUrl()}${Api.hlsMaster}/${videoId}/${index}/master.m3u8`;
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
