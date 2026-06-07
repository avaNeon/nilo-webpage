import { Api } from "@/shared/config/Api";
import request from "@/shared/lib/request";
import type { VideoInfoDoc } from "@/shared/model/VideoInfoDoc";
import type { VideoSearchResult } from "@/shared/model/VideoSearchResult";

export const VideoSearchApi = {
  /**
   * 搜索视频
   *
   * @param orderType 排序类型（1-4）
   * @param pageNo 页号（从1开始）
   * @param pageSize 每页条数（1-20）
   * @param keyword 搜索关键字
   */
  async searchVideo(
    orderType: number,
    pageNo: number,
    pageSize: number,
    keyword: string,
  ): Promise<VideoSearchResult | null> {
    const result = await request({
      method: "get",
      url: `${Api.videoSearch}/${orderType}/${pageNo}/${pageSize}`,
      params: { keyword },
    });
    if (!result) {
      return null;
    }
    return result.data as VideoSearchResult;
  },

  /**
   * 视频详情页推荐视频
   *
   * @param videoId 视频ID
   * @param videoName 视频标题
   */
  async searchRecommendVideo(
    videoId: string | number,
    videoName: string,
  ): Promise<VideoInfoDoc[] | null> {
    const result = await request({
      method: "get",
      url: `${Api.videoSearch}/${videoId}`,
      params: { videoName },
    });
    if (!result) {
      return null;
    }
    return result.data as VideoInfoDoc[];
  },

  /**
   * 获取热搜榜单
   */
  async getHotKeyword(): Promise<string[] | null> {
    const result = await request({
      method: "get",
      url: `${Api.videoSearch}/hot/keyword`,
    });
    if (!result) {
      return null;
    }
    return result.data as string[];
  },
};
