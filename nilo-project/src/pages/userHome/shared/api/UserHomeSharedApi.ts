import request from "@/shared/lib/request";
import { Api } from "@/shared/config/Api";
import type { VideoInfo } from "@/shared/model/VideoInfo";
import type { PaginationResponse } from "@/pages/userHome/shared/model/PaginationResponse";
import type { VideoSeriesInfo } from "@/pages/userHome/shared/model/VideoSeriesInfo";
import type { VideoSeriesWithVideos } from "@/pages/userHome/shared/model/VideoSeriesWithVideos";

export const UserHomeSharedApi = {
  /**
   * 查询视频列表，按照创建时间倒序排序
   *
   * @param userId 目标用户ID
   * @param pageNo 分页号（从1开始）
   * @returns false 查询失败 | null 查询成功但无数据 | PaginationResponse<VideoInfo> 查询成功且有数据
   */
  async loadVideo(
    userId: string,
    pageNo: number,
    pageSize: number,
    sortType?: number,
  ): Promise<PaginationResponse<VideoInfo> | null | false> {
    if (sortType === undefined || sortType === null) {
      sortType = 1;
    }
    try {
      const result = await request({
        method: "get",
        url: `${Api.uHomeLoadVideo}/${userId}`,
        params: { pageNo, pageSize, sortType },
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
};
