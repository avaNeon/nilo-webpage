import { Api } from "@/shared/config/Api"
import request from "@/shared/lib/request"

export const CommentPostApi = {
    /**
     * 发布评论
     * @returns 新评论的 commentId（string），失败返回 null
     */
    async postComment(videoId: string, content: string, imgPaths?: string, repliedCommentId?: string): Promise<string | null> {
        const result = await request({
            method: 'post',
            url: Api.postComment,
            data: {
                videoId,
                content,
                ...(imgPaths !== undefined && { imgPaths }),
                ...(repliedCommentId !== undefined && { repliedCommentId }),
            },
            dataType: 'form',
        })
        if (result.code === 200) {
            return String(result.data)
        }
        else {
            return null
        }
    }
}