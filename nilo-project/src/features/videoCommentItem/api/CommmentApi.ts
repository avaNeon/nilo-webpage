import request from "@/shared/lib/request"

export const CommentApi = {
    /**
     * 删除评论
     * @param commentId 评论ID
     */
    deleteComment(commentId: string) {
        return request({
            method: 'delete',
            url: '/comment/comment',
            params: {
                commentId
            }
        })
    },

    /**
     * 置顶评论
     * @param commentId 评论ID
     */
    topComment(commentId: string) {
        return request({
            method: 'post',
            url: '/comment/top',
            params: {
                commentId
            }
        })
    },

    /**
     * 取消置顶评论
     * @param commentId 评论ID
     */
    cancelTopComment(commentId: string) {
        return request({
            method: 'delete',
            url: '/comment/top',
            params: {
                commentId
            }
        })
    }
}
