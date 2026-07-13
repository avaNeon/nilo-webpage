//单服务版本
const Api = {
  // ——————系统配置——————
  systemConfig: "/system/config",
  // ——————账户——————
  captcha: "/account/captcha",
  login: "/account/login",
  logout: "/account/logout",
  register: "/account/register",
  /** 申请邮箱验证码（REGISTER / RESET_PASSWORD） */
  sendEmailCode: "/account/email",
  /** 忘记密码重置 */
  resetPassword: "/account/reset",
  autoLogin: "/account/autoLogin",
  /** pending 图预签名（?imgKey=） */
  downloadImage: "/file/image",
  loadAllCategories: "/category/categories/all",
  getUserState: "/account/state",
  // ——————视频——————
  /** 取 MinIO 预签名 POST 表单（?fileSize=） */
  uploadVideo: "/file/video",
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
  ccVideoUploadQuota: "/creativeCenter/video/uploadQuota",
  ccImageUploadQuota: "/creativeCenter/image/uploadQuota",
  playCount: "/video",
  //获取视频列表
  getFirstLevelCommentCount: "/comment/count",
  loadRecommendVideo: "/video/recommend",
  loadVideoInfo: "/video/video",
  loadVideoFileList: "/video/file",
  hlsMasterPlaylist: "/file/video/hls",
  //评论（用户端，走 nilo-comment；点赞态用列表字段 isUpvoted / isDownvoted，勿再 GET action）
  commentAction: "/user/commentAction/action",
  getCommentList: "/comment/comment",
  postComment: "/comment/comment",
  topComment: "/comment/top",
  //弹幕（加载按时间轴区间：GET /danmaku/{videoId}?fileIndex&fromMs&toMs）
  loadDanmaku: "/danmaku",
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
  videoSearch: "/video-search",
};

/** Web 服务路径前缀 */
const WEB_SERVICE_PREFIX = "/web";

/** Comment 微服务路径前缀（与 VITE_APP_BASE_URL 拼接后为 /api/comment） */
const COMMENT_SERVICE_PREFIX = "/comment";

/**
 * 按业务 path 选择服务前缀。
 * 用户端评论 CRUD / 点赞点踩走 nilo-comment；创作中心评论管理仍走 nilo-web。
 */
function resolveServicePrefix(url: string): string {
  if (
    url.startsWith("/comment") ||
    url.startsWith("/user/commentAction")
  ) {
    return COMMENT_SERVICE_PREFIX;
  }
  return WEB_SERVICE_PREFIX;
}

/** web 服务绝对根地址（Hls.js 等需要绝对 URL） */
function getWebBaseUrl() {
  return `${window.location.origin}${import.meta.env.VITE_APP_BASE_URL}${WEB_SERVICE_PREFIX}`;
}

export {
  Api,
  getWebBaseUrl,
  WEB_SERVICE_PREFIX,
  COMMENT_SERVICE_PREFIX,
  resolveServicePrefix,
};
