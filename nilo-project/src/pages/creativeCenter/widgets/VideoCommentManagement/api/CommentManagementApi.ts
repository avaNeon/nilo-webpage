import { Api } from "@/shared/config/Api";
import request from "@/shared/lib/request";
import type { CommentManagement } from "@/pages/creativeCenter/widgets/VideoCommentManagement/model/CommentManagement";

export const CommentManagementApi = {
  /**
   * 获取评论管理信息数量
   *
   * @param videoId   视频ID（可选）
   * @param nameFuzzy 视频名称模糊搜索（可选）
   */
  async getCommentCount(
    videoId: string | undefined,
    nameFuzzy: string | undefined,
  ): Promise<number | null> {
    const params: Record<string, unknown> = {};
    if (videoId !== undefined) {
      params.videoId = videoId;
    }
    if (nameFuzzy !== undefined) {
      params.nameFuzzy = nameFuzzy;
    }
    const result = await request({
      method: "get",
      url: Api.ccCommentCount,
      params,
    });
    if (!result) {
      return null;
    }
    return result.data as number;
  },

  /**
   * 获取评论管理信息列表
   *
   * @param videoId   视频ID（可选）
   * @param pageNo    页号（从1开始）
   * @param pageSize  页大小（1-10）
   * @param nameFuzzy 视频名称模糊搜索（可选）
   */
  async getCommentList(
    videoId: string | undefined,
    pageNo: number,
    pageSize: number,
    nameFuzzy: string | undefined,
  ): Promise<CommentManagement[] | null> {
    const params: Record<string, unknown> = {};
    if (videoId !== undefined) {
      params.videoId = videoId;
    }
    if (nameFuzzy !== undefined) {
      params.nameFuzzy = nameFuzzy;
    }
    const result = await request({
      method: "get",
      url: Api.ccCommentList + "/" + pageNo + "/" + pageSize,
      params,
    });
    if (!result) {
      return null;
    }
    return result.data as CommentManagement[];
  },
} as const;
