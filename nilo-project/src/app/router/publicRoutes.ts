import type { RouteLocationNormalized } from "vue-router";

/** 未登录用户可访问的路径 */
const PUBLIC_PATH_PATTERNS = [
  /^\/$/,
  /^\/c(?:\/|$)/,
  /^\/video\//,
  /^\/popular$/,
  /^\/unlogged$/,
  // /user/:userId 及其子路由（投稿、系列、收藏、粉丝/关注列表等）
  /^\/user\/[^/]+(?:\/|$)/,
];

export function isPublicRoute(route: RouteLocationNormalized): boolean {
  return PUBLIC_PATH_PATTERNS.some(pattern => pattern.test(route.path));
}
