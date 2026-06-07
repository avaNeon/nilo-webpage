import request from "@/shared/lib/request";
import { Api } from "@/shared/config/Api";
import type { VideoInfo } from "@/shared/model/VideoInfo";
import type { PaginationResponse } from "@/shared/model/PaginationResponse";
import type { VideoSeriesInfo } from "@/pages/userHome/shared/model/VideoSeriesInfo";
import type { VideoSeriesWithVideos } from "@/pages/userHome/shared/model/VideoSeriesWithVideos";
import type { FollowUserInfo } from "@/pages/userHome/shared/model/FollowUserInfo";

export const UserHomeSharedApi = {
  /**
   * 查询视频列表
   *
   * @param userId 目标用户ID
   * @param pageNo 分页号（从1开始）
   * @param pageSize 每页大小
   * @param sortType 排序类型
   * @param keyword 搜索关键词（最大长度100）
   * @returns false 查询失败 | null 查询成功但无数据 | PaginationResponse<VideoInfo> 查询成功且有数据
   */
  async loadVideo(
    userId: string,
    pageNo: number,
    pageSize: number,
    sortType?: number,
    keyword?: string,
  ): Promise<PaginationResponse<VideoInfo> | null | false> {
    if (sortType === undefined || sortType === null) {
      sortType = 1;
    }
    try {
      const params: Record<string, string | number> = { pageNo, pageSize, sortType };
      if (keyword && keyword.trim()) {
        params.keyword = keyword.trim().substring(0, 100);
      }
      const result = await request({
        method: "get",
        url: `${Api.uHomeLoadVideo}/${userId}`,
        params,
      });

      if (!result) return null;

      return result.data as PaginationResponse<VideoInfo>;
    } catch {
      return false;
    }
  },

  /**
   * 获取用户系列展示（包含系列中的视频列表）
   *
   * @param userId 目标用户ID
   * @returns false 查询失败 | null 查询成功但无数据 | VideoSeriesWithVideos[] 查询成功且有数据
   */
  async loadSeriesWithVideos(
    userId: string,
  ): Promise<VideoSeriesWithVideos[] | null | false> {
    try {
      const result = await request({
        method: "get",
        url: `${Api.uHomeLoadSeriesWithVideos}/${userId}`,
      });

      if (!result) return null;

      return result.data as VideoSeriesWithVideos[];
    } catch {
      return false;
    }
  },
  /**
   * 根据系列ID获取视频系列信息
   *
   * @param seriesId 视频系列ID
   * @returns false 查询失败 | null 查询成功但无数据 | VideoSeriesInfo 查询成功且有数据
   */
  async getVideoSeriesInfo(
    seriesId: string,
  ): Promise<VideoSeriesInfo | null | false> {
    try {
      const result = await request({
        method: "get",
        url: `${Api.uHomeSeriesInfo}/${seriesId}`,
      });

      if (!result) return null;

      return result.data as VideoSeriesInfo;
    } catch {
      return false;
    }
  },

  /**
   * 获取粉丝列表
   *
   * @param pageNo 分页号（从1开始）
   * @param pageSize 每页大小（1~10）
   * @returns false 查询失败 | null 查询成功但无数据 | BriefUserInfo[] 查询成功且有数据
   */
  async getFollowerList(
    pageNo: number,
    pageSize: number,
  ): Promise<FollowUserInfo[] | null | false> {
    try {
      const result = await request({
        method: "get",
        url: `${Api.getFollowerList}/${pageNo}/${pageSize}`,
      });

      if (!result) return null;

      return result.data as FollowUserInfo[];
    } catch {
      return false;
    }
  },

  /**
   * 获取关注列表
   *
   * @param pageNo 分页号（从1开始）
   * @param pageSize 每页大小（1~10）
   * @returns false 查询失败 | null 查询成功但无数据 | BriefUserInfo[] 查询成功且有数据
   */
  async getFollowingList(
    pageNo: number,
    pageSize: number,
  ): Promise<FollowUserInfo[] | null | false> {
    try {
      const result = await request({
        method: "get",
        url: `${Api.getFollowingList}/${pageNo}/${pageSize}`,
      });

      if (!result) return null;

      return result.data as FollowUserInfo[];
    } catch {
      return false;
    }
  },
};
