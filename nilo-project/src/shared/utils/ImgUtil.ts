import { publicImageUrl, publicImageThumbUrl, thumbKey } from "@/shared/config/Minio";
import { imageApi } from "@/shared/api/ImageApi";

/** 已公开图片 URL；thumb=true 时用缩略图 */
function imgRequestUrl(path: string | null | undefined, thumb = false): string {
  if (!path) return "";
  return thumb ? publicImageThumbUrl(path) : publicImageUrl(path);
}

/** 属主私有图：走后端预签名；thumb=true 时签缩略图 key */
async function resolveImageUrl(
  plainKey: string | null | undefined,
  thumb = false,
): Promise<string> {
  if (!plainKey) return "";
  const key = thumb ? thumbKey(plainKey) : plainKey;
  const url = await imageApi.getPresignedImageUrl(key);
  return url ?? "";
}

export { imgRequestUrl, resolveImageUrl };
