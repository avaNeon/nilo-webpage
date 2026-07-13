import request from "@/shared/lib/request";
import { getAdminBaseUrl, Api } from "@/shared/config/Api";
import type { VideoInfoArchiveQuery } from "@/pages/index/widgets/content/archive/model/VideoInfoArchiveQuery";
import type { VideoInfoArchive } from "@/pages/index/widgets/content/archive/model/VideoInfoArchive";
import type { VideoInfoFileArchive } from "@/pages/index/widgets/content/archive/model/VideoInfoFileArchive";

export const ArchiveApi = {
  /**
   * 获取存档视频列表
   * @param query                 查询参数
   * @param orderByDeleteTimeAsc  按删除时间升序排列
   */
  async loadArchiveList(
    query: VideoInfoArchiveQuery,
    orderByDeleteTimeAsc?: boolean,
  ): Promise<VideoInfoArchive[] | null> {
    const result = await request({
      method: "post",
      url: Api.archiveList,
      data: query as unknown as Record<string, any>,
      params: { orderByDeleteTimeAsc },
    });
    if (!result) return null;
    return (result.data ?? []) as VideoInfoArchive[];
  },

  /**
   * 获取存档视频数量
   * @param query 查询参数
   */
  async loadArchiveCount(query: VideoInfoArchiveQuery): Promise<number | null> {
    const result = await request({
      method: "post",
      url: Api.archiveCount,
      data: query as unknown as Record<string, any>,
    });
    if (!result) return null;
    return (result.data ?? 0) as number;
  },

  /**
   * 获取存档视频分 P 列表
   * @param videoId 视频ID
   */
  async loadArchiveFileList(
    videoId: string,
  ): Promise<VideoInfoFileArchive[] | null> {
    const result = await request({
      method: "get",
      url: `${Api.archiveFileList}/${videoId}`,
    });
    if (!result) return null;
    return (result.data ?? []) as VideoInfoFileArchive[];
  },

  /**
   * 批量删除视频存档（彻底清除）
   * @param videoIdList 视频ID列表
   */
  async deleteVideoArchive(videoIdList: string[]) {
    return request({
      method: "delete",
      url: Api.archiveVideos,
      params: { videoIdList },
    });
  },

  /**
   * 恢复被删除的视频（从存档中移回正常列表）
   * @param videoId 视频ID
   */
  async recoverVideo(videoId: string) {
    return request({
      method: "put",
      url: `${Api.videoRecover}/${videoId}`,
    });
  },

  // —————— 存档 HLS 播放地址构建 ——————

  /**
   * 构建存档视频 HLS 主播放列表地址（master.m3u8）
   * @param videoId 视频ID
   * @param index   分P索引（从1开始）
   */
  getArchiveHlsMasterUrl(videoId: string, index: number = 1): string {
    return `${getAdminBaseUrl()}${Api.archiveHlsMaster}/${videoId}/${index}/master.m3u8`;
  },
} as const;
