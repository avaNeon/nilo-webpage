import { Api } from "@/shared/config/Api";
import request from "@/shared/lib/request";
import { notEmpty, range } from "@/shared/utils/ValidateUtil";
import type { PaginationResponse } from "@/shared/model/PaginationResponse";
import type { CollectedVideoInfo } from "../model/CollectedVideoInfo";

export const UserHomeCollectionApi = {
  /**
   * 查询收藏视频列表，按照创建时间倒序排序
   *
   * @param userId 目标用户ID
   * @param pageNo 分页号（从1开始）
   * @returns null 请求失败 | PaginationResponse<CollectedVideoInfo> 请求成功（空列表表示无数据）
   */
  async loadCollection(
    userId: string,
    pageNo: number,
  ): Promise<PaginationResponse<CollectedVideoInfo> | null> {
    notEmpty(userId, "userId");
    range(pageNo, 1, Infinity, "pageNo");

    const result = await request({
      method: "get",
      url: `${Api.uHomeLoadCollection}${userId}`,
      params: { pageNo },
    });
    if (!result) {
      return null;
    }
    return result.data as PaginationResponse<CollectedVideoInfo>;
  },
} as const;
