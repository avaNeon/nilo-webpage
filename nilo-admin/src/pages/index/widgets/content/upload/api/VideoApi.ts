import request from "@/shared/lib/request";
import { Api } from "@/shared/config/Api";
import type { VideoInfoUploadQuery } from "@/pages/index/widgets/content/upload/model/VideoInfoUploadQuery";
import type { VideoInfoUpload } from "@/pages/index/widgets/content/upload/model/VideoInfoUpload";
import type { VideoInfoFileUpload } from "@/pages/index/widgets/content/upload/model/VideoInfoFileUpload";

export const VideoApi = {
  /**
   * 获取上传视频数量
   * @param query 查询参数
   * @returns 符合条件的视频总数
   */
  async loadVideoCount(query: VideoInfoUploadQuery): Promise<number | null> {
    const result = await request({
      method: "post",
      url: Api.videoCount,
      data: query as unknown as Record<string, any>,
    });
    if (!result) return null;
    return (result.data ?? 0) as number;
  },

  /**
   * 获取视频列表
   * @param query            查询参数（请求体）
   * @param orderByLastUpdateTimeAsc 按最后更新时间升序排列
   * @param orderByStatusAsc  按状态升序排列
   * @returns 视频列表
   */
  async loadVideoList(
    query: VideoInfoUploadQuery,
    orderByLastUpdateTimeAsc?: boolean,
    orderByStatusAsc?: boolean,
  ): Promise<VideoInfoUpload[] | null> {
    const result = await request({
      method: "post",
      url: Api.videoList,
      data: query as unknown as Record<string, any>,
      params: { orderByLastUpdateTimeAsc, orderByStatusAsc },
    });
    if (!result) return null;
    return (result.data ?? []) as VideoInfoUpload[];
  },

  /**
   * 获取视频分P列表
   * @param videoId 视频ID
   * @returns 视频分P文件列表
   */
  async loadVideoFileList(
    videoId: string,
  ): Promise<VideoInfoFileUpload[] | null> {
    const result = await request({
      method: "get",
      url: `${Api.videoFileList}/${videoId}`,
    });
    if (!result) return null;
    return (result.data ?? []) as VideoInfoFileUpload[];
  },

  /**
   * 获取视频存档分P列表
   * @param videoId 视频ID
   * @returns 视频分P文件列表
   */
  async loadArchiveFileList(
    videoId: string,
  ): Promise<VideoInfoFileUpload[] | null> {
    const result = await request({
      method: "get",
      url: `${Api.archiveFileList}/${videoId}`,
    });
    if (!result) return null;
    return (result.data ?? []) as VideoInfoFileUpload[];
  },

  /**
   * 审核视频
   * @param videoId 视频ID
   * @param reviewResult 审核结果，true表示审核通过，false表示审核不通过
   * @param refuseReason 拒绝理由，当审核不通过时需要提供
   */
  async reviewVideo(
    videoId: string,
    reviewResult: boolean,
    refuseReason?: string,
  ) {
    return request({
      method: "put",
      url: Api.videoReview,
      params: { videoId, reviewResult, refuseReason },
    });
  },

  /**
   * 切换视频推荐状态
   * @param videoId 视频ID
   */
  async toggleVideoRecommend(videoId: string) {
    return request({
      method: "put",
      url: `${Api.videoRecommend}/${videoId}`,
      params: { videoId },
    });
  },

  /**
   * 删除用户视频
   * @param userId 用户ID
   * @param videoId 视频ID
   * @param detail 删除原因
   */
  async deleteVideo(userId: string, videoId: string, detail: string) {
    return request({
      method: "delete",
      url: `${Api.videoDelete}/${userId}/${videoId}`,
      params: { detail },
    });
  },
} as const;
