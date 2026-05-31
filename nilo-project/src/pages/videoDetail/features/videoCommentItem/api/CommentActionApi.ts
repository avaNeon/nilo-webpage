import { Api } from "@/shared/config/Api"
import request from "@/shared/lib/request"

export const CommentActionApi = {
    async commentAction(videoId: string, commentId: string,
        /**
         * upvote = 1,
         * downvote = 2,
         */
        actionType: number) {
        request({
            method: 'post',
            url: Api.commentAction,
            params: {
                videoId,
                commentId,
                actionType
            }
        })
    }
}