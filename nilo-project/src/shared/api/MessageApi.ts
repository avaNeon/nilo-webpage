import { Api } from "@/shared/config/Api";
import request from "@/shared/lib/request";
import type { UserMessageCount } from "@/shared/model/UserMessageCount";

export const MessageApi = {
  /**
   * 获取用户未读信息数量
   */
  async getUncheckedMessageCount(): Promise<UserMessageCount | null> {
    const result = await request({
      method: "get",
      url: Api.messageUnchecked,
    });
    if (!result) {
      return null;
    }
    return result.data as UserMessageCount;
  },
};
