/** 浏览器标签页站点名 */
export const APP_NAME = "nilo";

/**
 * 设置页面标题。无 title 时仅显示站点名。
 * @param title 页面标题（不含站点名后缀）
 */
export function setPageTitle(title?: string | null) {
  const trimmed = title?.trim();
  document.title = trimmed ? `${trimmed} - ${APP_NAME}` : APP_NAME;
}
