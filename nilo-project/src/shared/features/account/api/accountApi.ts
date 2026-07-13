import request from "@/shared/lib/request";
import { Api } from "@/shared/config/Api";
import type { TokenUserInfo } from "@/shared/model/TokenUserInfo";
import type {
  EmailCodeScene,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  SendEmailCodeRequest,
} from "../model/LoginInfo";

export const AccountApi = {
  /**
   * 登录（图形验证码）
   */
  async login(
    data: LoginRequest,
    errorCallback?: () => void,
  ): Promise<TokenUserInfo | null> {
    const result = await request({
      method: "post",
      url: Api.login,
      data,
      dataType: "json",
      errorCallback,
    });
    if (!result) return null;
    return result.data;
  },

  /**
   * 申请邮箱验证码。
   * @returns 实际生效场景（以后端 data 为准），失败返回 null
   */
  async sendEmailCode(
    data: SendEmailCodeRequest,
    errorCallback?: (data: any) => void,
  ): Promise<EmailCodeScene | null> {
    const result = await request({
      method: "post",
      url: Api.sendEmailCode,
      data,
      dataType: "json",
      errorCallback,
    });
    if (!result) return null;
    return result.data as EmailCodeScene;
  },

  /**
   * 注册（邮箱验证码，不再传 captchaKey/code）
   */
  async register(
    data: RegisterRequest,
    errorCallback?: (data: any) => void,
  ): Promise<boolean> {
    const result = await request({
      method: "post",
      url: Api.register,
      data,
      dataType: "json",
      errorCallback,
    });
    return Boolean(result);
  },

  /**
   * 忘记密码重置
   */
  async resetPassword(
    data: ResetPasswordRequest,
    errorCallback?: (data: any) => void,
  ): Promise<boolean> {
    const result = await request({
      method: "post",
      url: Api.resetPassword,
      data,
      dataType: "json",
      errorCallback,
    });
    return Boolean(result);
  },
} as const;
