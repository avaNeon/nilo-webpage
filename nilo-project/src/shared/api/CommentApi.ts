import request from "@/shared/lib/request";
import { Api } from "@/shared/config/Api";

export const CommentApi = {
  /**
   * 删除评论
   * @param commentId 评论ID
   */
  async deleteComment(commentId: string) {
    return request({
      method: "delete",
      url: Api.postComment,
      params: { commentId },
    });
  },
} as const;
