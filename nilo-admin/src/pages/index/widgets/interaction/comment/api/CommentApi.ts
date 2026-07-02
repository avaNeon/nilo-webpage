import request from "@/shared/lib/request";
import { Api } from "@/shared/config/Api";
import type { Comment } from "@/pages/index/widgets/interaction/comment/model/Comment";

export const CommentApi = {
  /**
   * 获取评论管理信息数量
   * @param nameFuzzy 名称模糊查询
   */
  async loadCommentCount(nameFuzzy?: string): Promise<number | null> {
    const result = await request({
      method: "get",
      url: Api.commentCount,
      params: { nameFuzzy },
    });
    if (!result) return null;
    return (result.data ?? 0) as number;
  },

  /**
   * 获取评论管理信息
   * @param pageNo    页号（从1开始）
   * @param pageSize  页大小（1-10）
   * @param nameFuzzy 名称模糊查询
   */
  async loadCommentList(
    pageNo: number,
    pageSize: number,
    nameFuzzy?: string,
  ): Promise<Comment[] | null> {
    const result = await request({
      method: "get",
      url: `${Api.commentList}/${pageNo}/${pageSize}`,
      params: { nameFuzzy },
    });
    if (!result) return null;
    return (result.data ?? []) as Comment[];
  },

  /**
   * 删除视频评论（逻辑删除）
   * @param commentId 评论ID
   */
  async deleteComment(commentId: string) {
    return request({
      method: "delete",
      url: `${Api.commentDelete}/${commentId}`,
    });
  },

  /**
   * 真正删除指定视频评论（仅会删除已逻辑删除的评论）
   * @param commentId 评论ID
   */
  async destroyComment(commentId: string) {
    return request({
      method: "delete",
      url: `${Api.commentDestroy}/${commentId}`,
    });
  },

  /**
   * 真正删除指定时间范围的视频评论（仅会删除已逻辑删除的评论）
   * @param postTimeStart 开始日期（yyyy-MM-dd）
   * @param postTimeEnd   结束日期（yyyy-MM-dd）
   */
  async destroyCommentsByPostTimeRange(
    postTimeStart: string,
    postTimeEnd: string,
  ) {
    return request({
      method: "delete",
      url: Api.commentDestroyRange,
      params: { postTimeStart, postTimeEnd },
    });
  },
} as const;
