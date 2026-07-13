import { publicImageUrl, publicImageThumbUrl, thumbKey } from "@/shared/config/Minio";
import { FileApi } from "@/shared/api/FileApi";

/** 已公开图片 URL；thumb=true 时用缩略图 */
function imgRequestUrl(
  path: string | null | undefined,
  thumb = false,
): string {
  if (!path) return "";
  return thumb ? publicImageThumbUrl(path) : publicImageUrl(path);
}

/** 私有图：走后端预签名；thumb=true 时签缩略图 key */
async function resolveImageUrl(
  plainKey: string | null | undefined,
  thumb = false,
): Promise<string> {
  if (!plainKey) return "";
  const key = thumb ? thumbKey(plainKey) : plainKey;
  const url = await FileApi.getPresignedImageUrl(key);
  return url ?? "";
}

export { imgRequestUrl, resolveImageUrl };
