import { Api } from "@/shared/config/Api";
import request from "@/shared/lib/request";
import type { TokenUserInfo } from "@/shared/model/TokenUserInfo";

export const AccountApi = {
  /**
   * auto-login
   * @returns TokenUserInfo
   */
  async autoLogin(): Promise<TokenUserInfo | null> {
    const result = await request({
      method: "get",
      url: Api.autoLogin,
    });
    if (!result?.data) {
      return null;
    }
    return result.data;
  },
} as const;
