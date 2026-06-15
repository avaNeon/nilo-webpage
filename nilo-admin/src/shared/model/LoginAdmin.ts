/**
 * 管理员登录请求体
 */
export interface LoginAdmin {
  /** 管理员账户 */
  account: string;
  /** 密码 */
  password: string;
  /** 验证码 Key */
  captchaKey: string;
  /** 验证码内容 */
  code: string;
}
