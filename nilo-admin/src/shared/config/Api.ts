/** API 路径常量 */
const Api = {
  // ——————管理员账户管理——————
  /** 获取验证码 */
  captcha: "/account/captcha",
  /** 管理员登录 */
  login: "/account/login",
  /** 自动登录 */
  autoLogin: "/account/autoLogin",
  /** 登出 */
  logout: "/account/logout",

  // ——————用户账户管理——————
  /** 获取用户账户列表 */
  userList: "/account/list",
  /** 统计用户账户总数 */
  userCount: "/account/count",
  /** 修改用户账户状态 */
  userStatus: "/account/status",

  // ——————全局统计——————
  /** 获取指定时间内的注册用户数据 */
  userStat: "/glob-stat/user",
  /** 获取近期统计数据 */
  recentStatistics: "/glob-stat/recent",

  // ——————分类管理——————
  /** 分页获取分类 */
  categoryPage: "/category/categories",
  /** 分层获取指定分类及其子分类 */
  categoryChildren: "/category/categories",
  /** 分层获取所有分类 */
  categoryAll: "/category/categories/all",
  /** 增加或修改分类 */
  categorySave: "/category/category",
  /** 删除分类 */
  categoryDelete: "/category/category",
  /** 重新排序分类 */
  categorySort: "/category/sortCategory",

  // ——————文件管理——————
  /** 上传图片 */
  uploadImage: "/file/image",
  /** 获取图片 */
  downloadImage: "/file/image",
  /** 下载HLS主播放列表 */
  hlsMaster: "/file/video/hls",
  /** 下载HLS分辨率播放列表 */
  hlsPlaylist: "/file/video/hls",
  /** 下载HLS分片 */
  hlsSegment: "/file/video/hls",

  // ——————视频管理——————
  /** 获取视频列表 */
  videoList: "/video/list",
  /** 获取上传视频数量 */
  videoCount: "/video/count",
  /** 获取视频分P列表 */
  videoFileList: "/video/file",
  /** 审核视频 */
  videoReview: "/video/review",
  /** 恢复被删除的视频 */
  videoRecover: "/video",
  /** 切换视频推荐状态 */
  videoRecommend: "/video/recommend",
  /** 删除用户视频 */
  videoDelete: "/video/video",

  // ——————存档管理——————
  /** 获取存档视频列表 */
  archiveList: "/archive/list",
  /** 获取存档视频数量 */
  archiveCount: "/archive/count",
  /** 批量删除视频存档 */
  archiveVideos: "/archive/videos",
  /** 获取视频分P列表 */
  archiveFileList: "/archive/file",
  /** 下载存档HLS主播放列表 */
  archiveHlsMaster: "/archive/video/hls",
  /** 下载存档HLS分辨率播放列表 */
  archiveHlsPlaylist: "/archive/video/hls",
  /** 下载存档HLS分片 */
  archiveHlsSegment: "/archive/video/hls",

  // ——————评论管理——————
  /** 获取评论管理信息数量 */
  commentCount: "/comment/count",
  /** 获取评论管理信息 */
  commentList: "/comment",
  /** 删除视频评论 */
  commentDelete: "/comment",
  /** 真正删除视频评论 */
  commentDestroy: "/comment/destroy",
  /** 按时间范围真正删除视频评论 */
  commentDestroyRange: "/comment/destroy/range",

  // ——————弹幕管理——————
  /** 获取弹幕管理信息数量 */
  danmakuCount: "/danmaku",
  /** 获取弹幕管理信息 */
  danmakuList: "/danmaku",
  /** 删除视频弹幕 */
  danmakuDelete: "/danmaku",

  // ——————系统配置——————
  /** 系统配置（获取 / 修改） */
  systemConfig: "/system/config",
};

/** 后端 Web 服务前缀（与 vite proxy 配置对应） */
const ADMIN_SERVICE_PREFIX = "/api/admin";

export { Api, ADMIN_SERVICE_PREFIX };
