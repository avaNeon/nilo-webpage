/** MinIO 地址与 bucket（浏览器可访问，勿带末尾斜杠） */
const minioEndpoint =
  (import.meta.env.VITE_MINIO_ENDPOINT as string | undefined)?.replace(
    /\/$/,
    "",
  ) ?? "http://rocky13:9000";

const imageBucket =
  (import.meta.env.VITE_MINIO_IMAGE_BUCKET as string | undefined) ??
  "nilo-image";

const videoBucket =
  (import.meta.env.VITE_MINIO_VIDEO_BUCKET as string | undefined) ??
  "nilo-video";

/** 去掉首尾斜杠，避免拼出 public//xxx */
function normalizeKey(key: string): string {
  return key.replace(/^\/+|\/+$/g, "");
}

/** 在扩展名前插入 `_thumb` */
function thumbKey(key: string): string {
  const normalized = normalizeKey(key);
  const i = normalized.lastIndexOf(".");
  return i < 0
    ? normalized
    : `${normalized.slice(0, i)}_thumb${normalized.slice(i)}`;
}

/** 公开图片 URL */
function publicImageUrl(plainKey: string): string {
  const key = normalizeKey(plainKey);
  if (!key) return "";
  return `${minioEndpoint}/${imageBucket}/public/${key}`;
}

/** 公开缩略图 URL */
function publicImageThumbUrl(plainKey: string): string {
  const key = normalizeKey(plainKey);
  if (!key) return "";
  return publicImageUrl(thumbKey(key));
}

/** 视频直传目标（presigned POST） */
function videoUploadUrl(): string {
  return `${minioEndpoint}/${videoBucket}`;
}

/** 已发布 HLS master 地址 */
function publicHlsMasterUrl(filePath: string): string {
  const key = normalizeKey(filePath);
  if (!key) return "";
  return `${minioEndpoint}/${videoBucket}/public/${key}/master.m3u8`;
}

/** 去掉 `tmp/` 前缀得到 plain key */
function toPlainKey(objectKey: string): string {
  return objectKey.startsWith("tmp/") ? objectKey.slice(4) : objectKey;
}

export {
  minioEndpoint,
  imageBucket,
  videoBucket,
  thumbKey,
  publicImageUrl,
  publicImageThumbUrl,
  videoUploadUrl,
  publicHlsMasterUrl,
  toPlainKey,
};
