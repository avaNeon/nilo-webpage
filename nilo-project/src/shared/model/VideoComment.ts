export interface VideoComment {
    /**
     * 评论ID【对外展示】
     */
    commentId: string;

    /**
     * 父级评论ID（为0表示顶层评论）
     */
    parentCommentId: string;

    /**
     * 回复内容
     */
    content: string;

    /**
     * 图片路径
     */
    imgPaths: string;

    /**
     * 用户ID
     */
    userId: string;

    /**
     * 0:未置顶 1:置顶
     */
    topType: number;

    /**
     * 发布时间
     */
    postTime: Date;

    /**
     * 点赞数量
     */
    upvoteCount: number;

    /**
     * 点踩数量
     */
    downvoteCount: number;

    /**
     * 直接子评论数（仅统计下一层，不含子评论的子评论）
     * 用于前端显示"查看 N 条回复"，以及判断 hasMoreChildren
     */
    replyCount: number;

    /**
     * 逻辑删除标记：
     * 0-未删除，1-用户自己删除，2-视频发布者删除，3-管理员删除
     */
    deleted: number;

    /**
     * 子评论列表
     */
    childCommentList: VideoComment[];

    /**
     * 是否还有更多子评论未展示（用于前端渲染"查看更多回复"入口）
     */
    hasMoreChildren: boolean;

    /**
     * 用户是否点赞
     */
    isUpvoted: boolean;

    /**
     * 用户是否点踩
     */
    isDownvoted: boolean;

    /**
     * 评论者昵称（关联 user_info.nick_name）
     */
    nickName: string;

    /**
     * 评论者头像（关联 user_info.avatar）
     */
    avatar: string;

    /**
     * 默认折叠原因（前端计算，预留后端下发扩展）
     * - 0 / undefined: 不折叠
     * - 1: 被发布者删除且投票结果 < 100
     * - 2: 投票结果 < -100
     * - 3: 不适宜指数 (II) > 30%
     */
    defaultFoldReason?: number;

}

/** 默认折叠原因常量 */
export const DefaultFoldReason = {
    /** 不折叠 */
    NONE: 0,
    /** 被发布者删除且投票结果 < 100 */
    DELETED_LOW_VOTES: 1,
    /** 投票结果 < -100 */
    LOW_VOTES: 2,
    /** 不适宜指数 > 30% */
    INAPPROPRIATE: 3,
} as const;