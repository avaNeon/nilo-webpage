import { ServiceType } from "@/shared/model/ServiceType";

//单服务版本
const Api = {
  // Backend System configuration
  systemConfig: "/system/config",
  // Account
  captcha: "/account/captcha",
  login: "/account/login",
  logout: "/account/logout",
  register: "/account/register",
  sendEmailCode: "/account/sendEmailCode",
  autoLogin: "/account/autoLogin",
  getUserRelation: "/account/userRelation",
  sourcePath: "/file/image?sourcePath=",
  tmpSourcePath: "/file/image?tmp=true&sourcePath=",
  loadAllCategories: "/category/categories/all",
  getSysSetting: "/sysSetting/getSetting",
  //发布视频
  preUploadVideo: "/file/videoTag",
  uploadVideo: "/file/video",
  delUploadVideo: "/file/video",
  postVideo: "/creativeCenter/postVideo",
  saveVideoInteraction: "/creativeCenter/saveVideoInteraction",
  getVideoByVideoId: "/creativeCenter/getVideoByVideoId",
  loadCreativeCenterVideoList: "/creativeCenter/video/list",
  getCreativeCenterVideoCountInfo: "/creativeCenter/getVideoCountInfo",
  uploadImage: "/file/image",
  //个人中心
  ucLoadAllVideo: "/creativeCenter/loadAllVideo",
  ucLoadComment: "/creativeCenter/loadComment",
  ucDelComment: "/creativeCenter/delComment",
  ucLoadDanmaku: "/creativeCenter/loadDanmaku",
  ucDelDanmaku: "/creativeCenter/delDanmaku",
  ucGetActualTimeStatisticsInfo: "/creativeCenter/getActualTimeStatisticsInfo",
  getWeekStatisticsInfo: "/creativeCenter/getWeekStatisticsInfo",
  ucDeleteVideo: "/creativeCenter/deleteVideo",
  //获取视频列表
  getFirstLevelCommentCount: "/comment/count",
  loadRecommendVideo: "/video/recommend",
  loadVideoInfo: "/video/video",
  loadVideoFileList: "/video/file",
  hlsMasterPlaylist: "/file/video/hls",
  getVideoInfo: "/video/getVideoInfo",
  //评论
  commentAction: "/user/commentAction/action",
  getCommentList: "/comment/comment",
  postComment: "/comment/comment",
  userDelComment: "/comment/userDelComment",
  userTopComment: "/comment/topComment",
  userCancelTopComment: "/comment/cancelTopComment",
  //弹幕
  loadDanmaku: "/danmaku/danmaku",
  postDanmaku: "/danmaku/danmaku",
  //上报在线人数
  sendHearbeat: "/online/heartbeat",
  //获取在线人数
  getOnlineCount: "/online/count",
  // 视频点赞，投币，收藏
  userVideoAction: "/user/videoAction/action",
  // 评论点赞，点踩
  userCommentAction: "/user/commentAction/action",
  //播放历史
  playHisotry: "/history/loadHistory",
  delHistory: "/history/delHistory",
  cleanHistory: "/history/cleanHistory",
  //消息
  getNoReadCount: "/message/getNoReadCount",
  loadUserMessage: "/message/loadMessage",
  delMessage: "/message/delMessage",
  getNoReadCountGroup: "/message/getNoReadCountGroup",
  readAll: "/message/readAll",
  //个人主页
  uHomeUpdateUserInfo: "/uhome/updateUserInfo",
  uHomeLoadVideo: "/uhome/loadVideoList",
  uHomeGetUsesrInfo: "/uhome/getUserInfo",
  //关注
  follow: "/follow",
  //取消关注
  cancelFollow: "/cancelFollow",
  //关注列表
  followList: "/loadFollowList",
  //粉丝列表
  uHomeFansList: "/uhome/loadFansList",
  //视频系列
  uHomeSeriesLoadVideoSeries: "/uhome/series/loadVideoSeries",
  //获取系列视频
  uHomeSeriesLoadAllVideo: "/uhome/series/loadAllVideo",
  //保存系列
  uHomeSeriesSaveVideoSeries: "/uhome/series/saveVideoSeries",
  //修改系列顺序
  uHomeSeriesChangeVideoSeriesSort: "/uhome/series/changeVideoSeriesSort",
  //获取系列详情
  uHomeSeriesGetVideoSeriesDetail: "/uhome/series/getVideoSeriesDetail",
  //删除系列
  uHomeSeriesDelVideoSeries: "/uhome/series/delVideoSeries",
  //保存系列视频
  uHomeSeriesSaveSeriesVideo: "/uhome/series/saveSeriesVideo",
  //删除系列视频
  uHomeSeriesDelSeriesVideo: "/uhome/series/delSeriesVideo",
  //获取所有列表
  uHomeSeriesLoadVideoSeriesWithVideo: "/uhome/series/loadVideoSeriesWithVideo",
  //收藏列表
  uHomeLoadCollection: "/uhome/loadUserCollection",
  //设置主题
  saveTheme: "/uhome/saveTheme",
  //搜索
  search: "/video/search",
  getSearchKeywordTop: "/video/getSearchKeywordTop",
  //推荐视频
  getVideoRecommend: "/video/getVideoRecommend",
  //热门视频
  hotVideoList: "/video/loadHotVideoList",
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
