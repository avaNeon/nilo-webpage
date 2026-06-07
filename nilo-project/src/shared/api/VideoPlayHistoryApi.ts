import request from "@/shared/lib/request";
import { Api } from "@/shared/config/Api";
import type { VideoPlayHistory } from "@/shared/model/VideoPlayHistory";

export const VideoPlayHistoryApi = {
  /**
   * 记录视频播放历史
   * @param videoId 视频ID
   * @param fileIndex 文件索引
   */
  async saveHistory(videoId: string, fileIndex: number) {
    return request({
      method: "post",
      url: `${Api.history}/${videoId}/${fileIndex}`,
    });
  },

  /**
   * 分页查询播放历史
   * @param pageNo 页码（从1开始）
   */
  async getHistoryList(pageNo: number): Promise<VideoPlayHistory[] | null> {
    const result = await request({
      method: "get",
      url: `${Api.history}/${pageNo}`,
    });
    if (!result) return null;
    return (result.data ?? []) as VideoPlayHistory[];
  },

  /**
   * 删除单条播放历史
   * @param videoId 视频ID
   * @param fileIndex 文件索引
   */
  async deleteHistory(videoId: string, fileIndex?: number) {
    return request({
      method: "delete",
      url: `${Api.history}/${videoId}${fileIndex ? `/${fileIndex}` : ""}`,
    });
  },

  /**
   * 删除全部播放历史
   */
  async deleteAllHistory() {
    return request({
      method: "delete",
      url: `${Api.history}/all`,
    });
  },
} as const;
