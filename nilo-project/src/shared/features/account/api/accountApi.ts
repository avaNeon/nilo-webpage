import request from "@/shared/lib/request";
import { Api } from "@/shared/config/Api";
import type { TokenUserInfo } from "@/shared/model/TokenUserInfo";

export const AccountApi = {
  /**
   * login
   * @param data request body
   * @param errorCallback request failed callback
   * @returns
   */
  async login(
    data: any,
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
   * register
   * @param data request body
   * @param errorCallback request failed callback
   * @returns
   */
  async register(data: any, errorCallback?: () => void): Promise<void> {
    await request({
      method: "post",
      url: Api.register,
      data,
      dataType: "json",
      errorCallback,
    });
  },
} as const;
