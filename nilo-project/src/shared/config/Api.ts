import { ServiceType } from "@/shared/model/ServiceType";

//单服务版本
const Api = {
  // ——————Backend System configuration——————
  systemConfig: "/system/config",
  // ——————Account——————
  captcha: "/account/captcha",
  login: "/account/login",
  logout: "/account/logout",
  register: "/account/register",
  autoLogin: "/account/autoLogin",
  sourcePath: "/file/image?sourcePath=",
  tmpSourcePath: "/file/image?tmp=true&sourcePath=",
  loadAllCategories: "/category/categories/all",
  getUserState: "/account/state",
  // ——————视频——————
  preUploadVideo: "/file/videoTag",
  uploadVideo: "/file/video",
  delUploadVideo: "/file/video",
  postVideo: "/creativeCenter/video",
  uploadImage: "/file/image",
  // ——————创作中心——————
  // 创作中心 - 主页
  loadRecentStatisticsInfo: "/statistics/recent",
  // 创作中心 - 视频管理
  ccLoadVideoList: "/creativeCenter/video/list",
  ccLoadVideoCount: "/creativeCenter/video/count",
  ccLoadVideoInfoFileUploadList: "/creativeCenter/file",
  // 创作中心 - 评论管理
  ccCommentCount: "/creativeCenter/comment/count",
  ccCommentList: "/creativeCenter/comment",
  // 创作中心 - 弹幕管理
  ccDanmakuCount: "/creativeCenter/danmaku",
  ccDanmakuList: "/creativeCenter/danmaku",
  // 删除弹幕
  delDanmaku: "/danmaku/danmaku",
  ccDeleteVideo: "/creativeCenter/video/",
  ccVideoInteraction: "/creativeCenter/video/interaction/",
  playCount: "/video",
  //获取视频列表
  getFirstLevelCommentCount: "/comment/count",
  loadRecommendVideo: "/video/recommend",
  loadVideoInfo: "/video/video",
  loadVideoFileList: "/video/file",
  hlsMasterPlaylist: "/file/video/hls",
  //评论
  commentAction: "/user/commentAction/action",
  getCommentList: "/comment/comment",
  postComment: "/comment/comment",
  //弹幕
  loadDanmaku: "/danmaku/danmaku",
  postDanmaku: "/danmaku/danmaku",
  //上报在线人数
  sendHearbeat: "/online/heartbeat",
  //获取在线人数
  getOnlineCount: "/online/count",
  // 视频点赞，投币，收藏
  userVideoAction: "/user/videoAction/action",
  //关注 / 取消关注
  follow: "/follow/follow",
  // ——————用户中心——————
  getUserDetail: "/uHome/user/",
};

// 区分不同的微服务
const ServicePrefixMap = {
  [ServiceType.web]: "/web",
  [ServiceType.admin]: "/admin",
};

/**
 * Build the browser-reachable absolute base URL for the web service module.
 * Must be absolute so that Hls.js and other relative-URL resolvers work correctly.
 */
function getWebBaseUrl() {
  return `${window.location.origin}${import.meta.env.VITE_APP_BASE_URL}${ServicePrefixMap[ServiceType.web] || ""}`;
}

export { Api, getWebBaseUrl, ServicePrefixMap };
