import request from "@/shared/lib/request";
import { Api } from "@/shared/config/Api";
import type { UpdatedUserInfo } from "../model/UpdatedUserInfo";
import type { TokenUserInfo } from "@/shared/model/TokenUserInfo";

export const UserInfoEditorApi = {
  /**
   * 更新用户信息（昵称、头像、性别、生日、学校、个人简介、公告信息）
   * 如果更新了昵称或头像，后端会返回新的token
   * @param data 更新请求体
   * @returns TokenUserInfo
   */
  async updateUserInfo(data: UpdatedUserInfo): Promise<TokenUserInfo | boolean | null> {
    const result = await request({
      method: "post",
      url: Api.updateUserInfo,
      data: data as unknown as Record<string, any>,
      dataType: "json",
    });

    if (!result) return false;

    return result.data as TokenUserInfo;
  },
} as const;
