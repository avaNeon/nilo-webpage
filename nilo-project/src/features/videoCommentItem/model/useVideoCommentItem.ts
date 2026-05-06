import type { VideoComment } from "@/shared/model/VideoComment"
import { DefaultFoldReason } from "@/shared/model/VideoComment"
import { CommentActionApi } from "../api/CommentActionApi"
import { CommentApi } from "../api/CommmentApi"
import message from "@/shared/lib/message"
import { ref, computed, onBeforeUnmount } from "vue"

// ----- 不适宜指数（II）检测词典 -----

const CN_DIRTY_WORDS: string[] = [
    '傻逼', '操你妈', '妈的', '卧槽', '尼玛', '脑残', '白痴',
    '蠢货', '废物', '垃圾', '去死', '傻叉', '狗日的', '贱人', '滚',
    '草泥马', '碧池', '日你妈', '死全家', '畜生',
]

const EN_DIRTY_WORDS: string[] = [
    'idiot', 'stupid', 'dumb', 'moron', 'asshole', 'bastard',
    'bitch', 'damn', 'fuck', 'shit', 'crap', 'jerk', 'loser',
    'suck', 'trash', 'retard',
]

/**
 * 计算评论的不适宜指数（Inappropriate Index, II）
 * @param text 评论文本
 * @returns II 值，范围 0~100
 */
export function judgeInappropriateIndex(text: string): number {
    if (!text || text.trim().length === 0) return 0

    // 按中英文标点 + 空白符分割
    const segments = text
        .split(/[，。！？、；：""''（）【】《》\s,.\!\?;:'"()\[\]{}<>]+/)
        .filter(s => s.trim().length > 0)

    if (segments.length === 0) return 0

    let dirtyCount = 0
    for (const segment of segments) {
        const lower = segment.toLowerCase()
        let isDirty = false

        // 中文词典匹配
        for (const word of CN_DIRTY_WORDS) {
            if (segment.includes(word)) {
                isDirty = true
                break
            }
        }

        // 英文词典匹配
        if (!isDirty) {
            for (const word of EN_DIRTY_WORDS) {
                if (lower.includes(word)) {
                    isDirty = true
                    break
                }
            }
        }

        if (isDirty) dirtyCount++
    }

    // II = (脏词段数 / 总段数) * 100，不保留小数
    return Math.round((dirtyCount / segments.length) * 100)
}

/**
 * 计算评论的默认折叠原因
 * @returns DefaultFoldReason 常量值，0 表示不折叠
 */
export function calcDefaultFoldReason(videoComment: VideoComment): number {
    const voteResult = videoComment.upvoteCount - videoComment.downvoteCount

    // 1. 被发布者删除且投票结果 < 100
    if (videoComment.deleted !== 0 && voteResult < 100) {
        return DefaultFoldReason.DELETED_LOW_VOTES
    }

    // 2. 投票结果 < -100
    if (voteResult < -100) {
        return DefaultFoldReason.LOW_VOTES
    }

    // 3. 不适宜指数 > 30%
    if (videoComment.content) {
        const ii = judgeInappropriateIndex(videoComment.content)
        if (ii > 30) {
            return DefaultFoldReason.INAPPROPRIATE
        }
    }

    return DefaultFoldReason.NONE
}

export function useVideoCommentItem() {
    const COMMENT_IMG_WIDTH = 200
    const AVATAR_WIDTH = 64

    // ----- 点赞/点踩 -----

    function upvote(videoId: string, videoComment: VideoComment) {
        CommentActionApi.commentAction(videoId, videoComment.commentId, 1)
        videoComment.isUpvoted = !videoComment.isUpvoted
        if (videoComment.isUpvoted) {
            videoComment.upvoteCount += 1
            if (videoComment.isDownvoted) {
                videoComment.isDownvoted = false
                videoComment.downvoteCount -= 1
            }
        } else {
            videoComment.upvoteCount -= 1
        }
    }

    function downvote(videoId: string, videoComment: VideoComment) {
        CommentActionApi.commentAction(videoId, videoComment.commentId, 2)
        videoComment.isDownvoted = !videoComment.isDownvoted
        if (videoComment.isDownvoted) {
            videoComment.downvoteCount += 1
            if (videoComment.isUpvoted) {
                videoComment.isUpvoted = false
                videoComment.upvoteCount -= 1
            }
        } else {
            videoComment.downvoteCount -= 1
        }
    }

    // ----- 票数计算结果 -----

    function calcVoteResult(videoComment: VideoComment): number {
        return videoComment.upvoteCount - videoComment.downvoteCount
    }

    // ----- 删除按钮确认流程 -----

    const isConfirming = ref(false)
    const cooldownActive = ref(false)
    const borderProgress = ref(0)
    let borderAnimFrameId: number | null = null

    const deleteButtonText = computed(() => {
        return isConfirming.value ? "确认删除" : "删除"
    })

    /** 启动边框顺时针绘制动画（3s） */
    function startBorderAnimation() {
        borderProgress.value = 0
        const startTime = performance.now()
        const duration = 3000

        function animate(now: number) {
            const elapsed = now - startTime
            borderProgress.value = Math.min(elapsed / duration, 1)
            if (borderProgress.value < 1) {
                borderAnimFrameId = requestAnimationFrame(animate)
            }
        }

        borderAnimFrameId = requestAnimationFrame(animate)
    }

    /**
     * 删除评论
     * @param videoComment 评论对象
     * @param isPublisherDelete 是否为视频发布者删除（非本人发布的评论），默认为 false
     */
    async function deleteComment(videoComment: VideoComment, isPublisherDelete: boolean = false) {
        // 冷却期间禁止点击
        if (cooldownActive.value) {
            return
        }

        if (!isConfirming.value) {
            // 第一次点击：进入确认模式 + 3s 冷却
            isConfirming.value = true
            cooldownActive.value = true
            startBorderAnimation()
            setTimeout(() => {
                cooldownActive.value = false
            }, 3000)
            return
        }

        // 第二次点击（冷却已结束）：执行实际删除
        const result = await CommentApi.deleteComment(videoComment.commentId)
        if (result && result.code === 200) {
            message.success("删除成功")
            videoComment.deleted = isPublisherDelete ? 2 : 1
            videoComment.topType = 0
        }
        // 非 200 时 request 拦截器已自动弹出错误提示，无需额外处理
    }

    // ----- 置顶/取消置顶 -----

    async function topComment(videoComment: VideoComment) {
        // 仅允许顶层评论（parentCommentId === '0'）置顶
        if (videoComment.parentCommentId !== '0') {
            message.warning("仅支持对顶层评论进行置顶操作")
            return
        }
        const result = await CommentApi.topComment(videoComment.commentId)
        if (result && result.code === 200) {
            message.success("置顶成功")
            videoComment.topType = 1
        }
    }

    async function cancelTopComment(videoComment: VideoComment) {
        const result = await CommentApi.cancelTopComment(videoComment.commentId)
        if (result && result.code === 200) {
            message.success("取消置顶成功")
            videoComment.topType = 0
        }
    }

    onBeforeUnmount(() => {
        if (borderAnimFrameId !== null) {
            cancelAnimationFrame(borderAnimFrameId)
        }
    })

    return {
        COMMENT_IMG_WIDTH,
        AVATAR_WIDTH,
        upvote,
        downvote,
        calcVoteResult,
        isConfirming,
        cooldownActive,
        borderProgress,
        deleteButtonText,
        deleteComment,
        topComment,
        cancelTopComment,
    }
}
