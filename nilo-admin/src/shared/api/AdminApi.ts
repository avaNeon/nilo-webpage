import request from "@/shared/lib/request";
import { Api } from "@/shared/config/Api";
import type { TokenAdmin } from "@/shared/model/TokenAdmin";
import type { LoginAdmin } from "@/shared/model/LoginAdmin";

export const AdminApi = {
  /**
   * 获取验证码<hr/>
   * 将验证码结果保存在 redis 中，对应的 key 和验证码图片封装到 Map 中返回
   * @returns { code: string, image: string } 验证码 key 和 Base64 图片
   */
  async captcha(): Promise<Record<string, string> | null> {
    const result = await request({
      method: "get",
      url: Api.captcha,
    });
    if (!result) return null;
    return result.data;
  },

  /**
   * 管理员登录<hr/>
   * 登录后返回一个新 token，删除 cookie 中原始登录 token；
   * redis 中的 token 不删除，等它自动过期
   * @param loginAdmin 登录信息（包含账户、密码、验证码）
   * @returns 登录成功后的管理员 Token 信息
   */
  async login(loginAdmin: LoginAdmin): Promise<TokenAdmin | null> {
    const result = await request({
      method: "post",
      url: Api.login,
      data: loginAdmin,
      dataType: "json",
    });
    if (!result) return null;
    return result.data;
  },

  /**
   * 自动登录<hr/>
   * 检验 token，如果 token 有效，则返回管理员信息
   * @returns 管理员 Token 信息
   */
  async autoLogin(): Promise<TokenAdmin | null> {
    const result = await request({
      method: "get",
      url: Api.autoLogin,
    });
    if (!result) return null;
    return result.data;
  },

  /**
   * 登出<hr/>
   * 从 redis 和 cookie 中删除 token
   * @returns 是否登出成功
   */
  async logout(): Promise<boolean | null> {
    const result = await request({
      method: "get",
      url: Api.logout,
    });
    if (!result) return null;
    return result.data;
  },
};
