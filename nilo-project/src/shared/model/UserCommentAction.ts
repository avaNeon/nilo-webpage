export interface UserCommentAction {
    /**
     * 自增ID
     */
    actionId: string;

    /**
     * 视频ID
     */
    videoId: string;

    /**
     * 评论ID
     */
    commentId: string;

    /**
     * 0:评论点赞 1:评论点踩
     */
    actionType: number;

    /**
     * 用户ID
     */
    userId: string;

    /**
     * 操作时间
     */
    actionTime: Date;
}