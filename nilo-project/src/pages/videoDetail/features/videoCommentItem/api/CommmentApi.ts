import request from "@/shared/lib/request"

export const CommentApi = {
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
