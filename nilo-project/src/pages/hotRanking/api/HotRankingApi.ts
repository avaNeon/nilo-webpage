import { Api } from "@/shared/config/Api";
import request from "@/shared/lib/request";
import type { VideoInfo } from "@/shared/model/VideoInfo";

export const HotRankingApi = {
  /**
   * 加载热门视频列表
   *
   * @param pageNo 页号（从1开始）
   */
  async loadHotVideo(pageNo: number): Promise<VideoInfo[] | null> {
    const result = await request({
      method: "get",
      url: Api.loadHotVideo + pageNo,
    });
    if (!result) {
      return null;
    }
    return result.data as VideoInfo[];
  },
};
