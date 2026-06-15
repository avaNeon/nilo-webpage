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
};

/** 后端 Web 服务前缀（与 vite proxy 配置对应） */
const ADMIN_SERVICE_PREFIX = "/api/admin";

export { Api, ADMIN_SERVICE_PREFIX };
