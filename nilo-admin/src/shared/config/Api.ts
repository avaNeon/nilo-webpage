/** API 路径常量 */
const Api = {
  // ——————账户管理——————
  /** 获取验证码 */
  captcha: "/account/captcha",
  /** 管理员登录 */
  login: "/account/login",
  /** 自动登录 */
  autoLogin: "/account/autoLogin",
  /** 登出 */
  logout: "/account/logout",

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
};

/** 后端 Web 服务前缀（与 vite proxy 配置对应） */
const ADMIN_SERVICE_PREFIX = "/api/admin";

export { Api, ADMIN_SERVICE_PREFIX };
