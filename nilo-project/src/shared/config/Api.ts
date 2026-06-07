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
  // 粉丝列表
  getFollowerList: "/follow/follower",
  // 关注列表
  getFollowingList: "/follow/following",
  // ——————用户中心——————
  getUserDetail: "/uHome/user/",
  updateUserInfo: "/uHome/user",
  // 用户中心 - 视频列表
  uHomeLoadVideo: "/uHome/video",
  // 用户中心 - 合集展示
  uHomeLoadSeriesWithVideos: "/uHome/series/videos",
  // 用户中心 - 收藏视频列表
  uHomeLoadCollection: "/uHome/collection/",
  // ——————视频合集管理（/series）——————
  // 获取用户的全部视频合集
  VideoSeries: "/series",
  // 重新排序视频合集
  VideoSeriesResort: "/series/resort",
  // 新增/修改视频合集
  VideoSeriesSave: "/series/series",
  // 向合集中添加视频
  VideoSeriesAddVideo: "/series/video",
  // 查询不在集合中的视频数量
  VideoSeriesExcludingCount: "/series/video/ex/count",
  // 分页查询不在集合中的视频
  VideoSeriesExcludingList: "/series/video/ex",
  // 分页查询集合中的视频（公开）
  VideoSeriesVideos: "/series/video",
  // 重新排序系列中的视频
  VideoSeriesVideoResort: "/series/video/resort",
  // 查询集合中的视频数量
  VideoSeriesVideoCount: "/series/video/count",
  // 从系列中移除一条视频
  VideoSeriesDeleteVideo: "/series/video",
  // 删除视频系列
  VideoSeriesDelete: "/series/series",
  // 根据系列ID获取视频系列信息
  uHomeSeriesInfo: "/series/series",
  // ——————用户主页-背景主题——————
  uHomeSaveTheme: "/uHome/theme/",
  // ——————播放历史——————
  history: "/history",
  // ——————消息中心——————
  // 获取用户未读信息数量
  messageUnchecked: "/message/unchecked",
  // 将一个分类的未读消息都标记为已读（/clear/{messageType}）
  messageClear: "/message/clear",
  // 将单条消息标记为已读（/check/{messageId}）
  messageCheck: "/message/check/",
  // 获取单个分类的消息数量（/{messageType}）
  messageCount: "/message/",
  // 分页获取单个分类的消息（/{messageType}/{pageNo}）
  messageList: "/message/",
  // 删除一条消息（/{messageId}）
  messageDelete: "/message/",
  // ——————热门视频——————
  loadHotVideo: "/video/hot/",
  // ——————视频搜索——————
  videoSearch: "/video-serach",
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
