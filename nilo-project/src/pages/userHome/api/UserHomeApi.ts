import request from "@/shared/lib/request";
import { Api } from "@/shared/config/Api";
import type { UserDetail } from "@/shared/model/UserDetail";

export const UserHomeApi = {
  /**
   * 获取用户主页信息
   * @param hostUserId 目标用户ID（路径变量）
   */
  async getUserDetail(hostUserId: string): Promise<UserDetail | null> {
    const result = await request({
      method: "get",
      url: Api.getUserDetail + hostUserId,
    });

    if (!result) return null;

    return result.data as UserDetail;
  },
};
