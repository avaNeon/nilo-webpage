import { Api } from "@/shared/config/Api";
import request from "@/shared/lib/request";
import {
  notEmpty,
  size,
  range,
  notEmptyArray,
} from "@/shared/utils/ValidateUtil";
import type { VideoSeriesInfo } from "@/pages/userHome/shared/model/VideoSeriesInfo";
import type { VideoInfo } from "@/shared/model/VideoInfo";

export const UserHomeVideoSeriesApi = {
  /**
   * 获取用户的全部视频系列
   *
   * 每个视频系列都带有第一个视频的封面，除非没有视频
   *
   * @param userId 目标用户ID
   * @returns null 查询失败或无数据 | VideoSeriesInfo[] 查询成功且有数据
   */
  async loadVideoSeries(userId: string): Promise<VideoSeriesInfo[] | null> {
    notEmpty(userId, "userId");

    const result = await request({
      method: "get",
      url: `${Api.VideoSeries}/${userId}/series`,
    });
    if (!result) {
      return null;
    }
    return result.data as VideoSeriesInfo[];
  },

  /**
   * 重新排序视频系列
   *
   * @param seriesIdList 系列ID的有序列表
   * @returns true 排序成功 | false 排序失败
   */
  async resortVideoSeries(seriesIdList: string[]): Promise<boolean> {
    notEmptyArray(seriesIdList, "seriesIdList");

    const result = await request({
      method: "put",
      url: Api.VideoSeriesResort,
      data: seriesIdList as unknown as Record<string, unknown>,
    });
    return result !== null && result.code === 200;
  },

  /**
   * 新增/修改视频系列
   *
   * @param seriesId          系列ID（修改时必传，新增时可不传）
   * @param seriesName        系列名称（1-100字符）
   * @param seriesDescription 系列描述（1-300字符）
   * @param videoIdList       视频ID列表（请求体）
   * @returns true 操作成功 | false 操作失败
   */
  async saveVideoSeries(
    seriesId: string | undefined,
    seriesName: string,
    seriesDescription: string,
    videoIdList: string[],
  ): Promise<boolean> {
    size(seriesName, 1, 100, "seriesName");
    notEmptyArray(videoIdList, "videoIdList");

    const params: Record<string, unknown> = {
      seriesName,
      seriesDescription,
    };
    if (seriesId !== undefined) {
      params.seriesId = seriesId;
    }
    const result = await request({
      method: "post",
      url: Api.VideoSeriesSave,
      params,
      data: videoIdList as unknown as Record<string, unknown>,
    });
    return result !== null && result.code === 200;
  },

  /**
   * 向系列中添加一条视频
   *
   * @param seriesId 系列ID
   * @param videoId  视频ID
   * @returns true 添加成功 | false 添加失败
   */
  async insertVideoToSeries(
    seriesId: string,
    videoId: string,
  ): Promise<boolean> {
    notEmpty(seriesId, "seriesId");
    notEmpty(videoId, "videoId");

    const result = await request({
      method: "post",
      url: `${Api.VideoSeriesAddVideo}/${seriesId}/${videoId}`,
    });
    return result !== null && result.code === 200;
  },

  /**
   * 查询有多少视频不在该系列中
   *
   * @param seriesId 系列ID
   * @returns null 查询失败 | number 不在系列中的视频数量
   */
  async getVideoExcludingSeries(seriesId: string): Promise<number | null> {
    notEmpty(seriesId, "seriesId");

    const result = await request({
      method: "get",
      url: `${Api.VideoSeriesExcludingCount}/${seriesId}`,
    });
    if (!result) {
      return null;
    }
    return result.data as number;
  },

  /**
   * 分页查询不在该系列中的视频
   *
   * @param seriesId 系列ID
   * @param pageNo   分页号（从1开始）
   * @returns null 查询失败或无数据 | VideoInfo[] 查询成功且有数据
   */
  async loadMoreVideoExcludingSeries(
    seriesId: string,
    pageNo: number,
  ): Promise<VideoInfo[] | null | false> {
    notEmpty(seriesId, "seriesId");
    range(pageNo, 1, Infinity, "pageNo");

    const result = await request({
      method: "get",
      url: `${Api.VideoSeriesExcludingList}/${seriesId}/${pageNo}`,
    });
    if (!result) {
      return false;
    }
    return result.data as VideoInfo[];
  },

  /**
   * 查询该系列中的所有视频
   *
   * @param seriesId 系列ID
   * @returns null 查询失败或无数据 | VideoInfo[] 查询成功且有数据
   */
  async loadSeriesVideo(
    seriesId: string,
  ): Promise<VideoInfo[] | null> {
    notEmpty(seriesId, "seriesId");

    const result = await request({
      method: "get",
      url: `${Api.VideoSeriesVideos}/${seriesId}`,
    });
    if (!result) {
      return null;
    }
    return result.data as VideoInfo[];
  },

  /**
   * 重新排序系列中的视频
   *
   * 请求体必须包含该系列当前全部视频ID，不会新增或删除视频
   *
   * @param seriesId    系列ID
   * @param videoIdList 视频ID的有序列表
   * @returns true 排序成功 | false 排序失败
   */
  async resortSeriesVideo(
    seriesId: string,
    videoIdList: string[],
  ): Promise<boolean> {
    notEmpty(seriesId, "seriesId");
    notEmptyArray(videoIdList, "videoIdList");

    const result = await request({
      method: "put",
      url: `${Api.VideoSeriesVideoResort}/${seriesId}`,
      data: videoIdList as unknown as Record<string, unknown>,
    });
    return result !== null && result.code === 200;
  },

  /**
   * 查询系列中的视频数量
   *
   * @param seriesId 系列ID
   * @returns null 查询失败 | number 系列中的视频数量
   */
  async getSeriesVideoCount(seriesId: string): Promise<number | null> {
    notEmpty(seriesId, "seriesId");

    const result = await request({
      method: "get",
      url: `${Api.VideoSeriesVideoCount}/${seriesId}`,
    });
    if (!result) {
      return null;
    }
    return result.data as number;
  },

  /**
   * 从系列中移除一条视频
   *
   * @param seriesId 系列ID
   * @param videoId  视频ID
   * @returns true 移除成功 | false 移除失败
   */
  async deleteSeriesVideo(
    seriesId: string,
    videoId: string,
  ): Promise<boolean> {
    notEmpty(seriesId, "seriesId");
    notEmpty(videoId, "videoId");

    const result = await request({
      method: "delete",
      url: `${Api.VideoSeriesDeleteVideo}/${seriesId}/${videoId}`,
    });
    return result !== null && result.code === 200;
  },

  /**
   * 删除视频系列
   *
   * @param seriesId 系列ID
   * @returns true 删除成功 | false 删除失败
   */
  async deleteSeries(seriesId: string): Promise<boolean> {
    notEmpty(seriesId, "seriesId");

    const result = await request({
      method: "delete",
      url: `${Api.VideoSeriesDelete}/${seriesId}`,
    });
    return result !== null && result.code === 200;
  },
} as const;
