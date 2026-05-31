import { Api } from "@/shared/config/Api";
import request from "@/shared/lib/request";
import type { VideoComment } from "@/shared/model/VideoComment";

export const VideoCommentApi = {
  async getCommentList(
    videoId: string,
    parentCommentId: string,
    pageNo: number,
    /**
     * earliest, latest, popular
     */
    orderType: string,
    depth?: number,
  ): Promise<VideoComment[]> {
    const result = await request({
      method: "get",
      url: Api.getCommentList,
      params: {
        videoId,
        parentCommentId,
        pageNo,
        orderType,
        depth,
      },
    });
    if (!result) {
      return [];
    } else {
      return result.data;
    }
  },
  async getFirstLevelCommentCount(videoId: string): Promise<number> {
    const result = await request({
      method: "get",
      url: Api.getFirstLevelCommentCount,
      params: {
        videoId,
      },
    });
    if (!result) {
      return 0;
    } else {
      return result.data as number;
    }
  },
};
