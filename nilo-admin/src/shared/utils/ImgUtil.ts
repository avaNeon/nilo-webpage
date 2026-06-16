import { ADMIN_SERVICE_PREFIX } from "@/shared/config/Api";

/**
 * 构造图片完整请求 URL<hr/>
 * 仅适用于 admin 后台系统
 *
 * @param path      图片相对路径（来自后端 uploadImage 的返回值）
 * @param tmp       是否为临时文件，默认 false
 * @returns 完整的浏览器可访问图片 URL
 */
function imgRequestUrl(path: string | null, tmp?: boolean): string {
  if (!path) {
    return "";
  }
  const base = `${import.meta.env.VITE_APP_BASE_URL ?? ""}${ADMIN_SERVICE_PREFIX}`;
  const separator = path.includes("?") ? "&" : "?";
  if (tmp) {
    return `${base}/file/image${separator}sourceName=${encodeURIComponent(path)}`;
  } else {
    return `${base}/file/image${separator}sourceName=${encodeURIComponent(path)}`;
  }
}

export { imgRequestUrl };
