/** 邮箱验证码场景（以后端响应 data 为准） */
export type EmailCodeScene = "REGISTER" | "RESET_PASSWORD";

/** 登录请求 */
export interface LoginRequest {
  email: string;
  password: string;
  code: string;
  captchaKey: string;
}

/** 注册请求（邮箱验证码） */
export interface RegisterRequest {
  email: string;
  nickName: string;
  password: string;
  emailCode: string;
}

/** 申请邮箱验证码 */
export interface SendEmailCodeRequest {
  email: string;
  scene: EmailCodeScene;
}

/** 重置密码 */
export interface ResetPasswordRequest {
  email: string;
  emailCode: string;
  newPassword: string;
}

/**
 * @deprecated 兼容旧命名；新代码请用 LoginRequest / RegisterRequest
 */
export type LoginInfo = LoginRequest & {
  nickName?: string;
};
