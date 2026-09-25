import request from "@/shared/lib/request";
import { Api } from "@/shared/config/Api";
import type { UserDetail } from "@/shared/model/UserDetail";

export const UserHomeApi = {
  /**
   * 获取用户主页信息
   * @param hostUserId 目标用户ID（路径变量）
   * @param options 可选请求配置：showError 控制是否自动弹错误提示，errorCallback 业务错误回调
   */
  async getUserDetail(
    hostUserId: string,
    options?: { showError?: boolean; errorCallback?: (data: any) => void },
  ): Promise<UserDetail | null> {
    const result = await request({
      method: "get",
      url: Api.getUserDetail + hostUserId,
      showError: options?.showError,
      errorCallback: options?.errorCallback,
    });

    const detail = result?.data as UserDetail | null | undefined;
    if (!detail) return null;

    // likeCount、playCount 后端是 Long，JSON 里传的是字符串，这里转回数字
    return {
      ...detail,
      likeCount: Number(detail.likeCount) || 0,
      playCount: Number(detail.playCount) || 0,
    };
  },
};
