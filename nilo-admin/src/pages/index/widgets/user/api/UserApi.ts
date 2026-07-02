import request from "@/shared/lib/request";
import { Api } from "@/shared/config/Api";
import type { UserInfo } from "@/pages/index/widgets/user/model/UserInfo";
import type { UserInfoQuery } from "@/pages/index/widgets/user/model/UserInfoQuery";

/** 用户账户管理相关接口 */
export const UserApi = {
  /**
   * 获取用户账户列表
   * @param query 查询参数（请求体）
   * @returns 用户账户列表
   */
  async loadUserInfoList(query: UserInfoQuery): Promise<UserInfo[] | null> {
    const result = await request({
      method: "post",
      url: Api.userList,
      data: query as unknown as Record<string, unknown>,
    });
    if (!result) return null;
    return (result.data ?? []) as UserInfo[];
  },

  /**
   * 查询用户账户总数
   * @param query 查询参数（请求体，无需 pageNo / pageSize）
   * @returns 符合条件的用户总数
   */
  async getUserInfoCount(
    query: Omit<UserInfoQuery, "pageNo" | "pageSize">,
  ): Promise<number | null> {
    const result = await request({
      method: "post",
      url: Api.userCount,
      data: query as unknown as Record<string, unknown>,
    });
    if (!result) return null;
    return (result.data ?? 0) as number;
  },

  /**
   * 修改用户账户状态
   * @param userId 用户ID
   * @param status 0:禁用 1:正常
   */
  async changeUserStatus(userId: string, status: number) {
    return request({
      method: "put",
      url: Api.userStatus,
      params: { userId, status },
    });
  },
} as const;
