/** 支持的视频扩展名（与后端 VIDEO_SUFFIXES 保持一致） */
export const VIDEO_EXTENSIONS = [
  ".mp4",
  ".webm",
  ".avi",
  ".mov",
  ".mkv",
  ".flv",
  ".wmv",
  ".mpeg",
  ".mpg",
  ".3gp",
  ".ogv",
  ".m4v",
  ".ts",
];

const EXTENSION_SET = new Set(VIDEO_EXTENSIONS);

/** 文件选择框的 accept */
export const VIDEO_ACCEPT = VIDEO_EXTENSIONS.join(",");

export function isValidVideoExtension(name: string): boolean {
  const lastDot = name.lastIndexOf(".");
  if (lastDot < 0) return false;
  return EXTENSION_SET.has(name.substring(lastDot).toLowerCase());
}
