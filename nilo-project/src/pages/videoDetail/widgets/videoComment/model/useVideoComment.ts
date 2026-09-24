import { computed, type Ref } from 'vue'
import type { VideoComment } from '@/shared/model/VideoComment'
import { COMMENT_AVATAR_METRICS } from '@/pages/videoDetail/features/videoCommentItem/model/useVideoCommentItem'

/** 连线粗细 */
export const LINE_WIDTH = 2
/** 连线圆角半径 */
export const CORNER_RADIUS = 10
/** 连线与头像 / 图标之间留出的空隙 */
export const LINE_GAP = 4
/** "展开更多回复" 入口：上内边距 + 内容行高，图标中心距入口顶部 = 8 + 28 / 2，需与 CommentThread 的 SCSS 保持一致 */
export const SHOW_MORE_CENTER = 22

/**
 * 某一层评论线程的头像几何参数（所有坐标都以该线程根节点左上角为原点）
 * depth = 0 为顶层评论，其余都按回复处理
 */
export function getThreadMetrics(depth: number) {
    const avatar = depth === 0 ? COMMENT_AVATAR_METRICS.root : COMMENT_AVATAR_METRICS.reply
    return {
        avatarSize: avatar.size,
        avatarTop: avatar.top,
        /** 头像中心 */
        centerX: avatar.size / 2,
        centerY: avatar.top + avatar.size / 2,
        /** 子评论缩进 = 头像宽 + 头像与正文间距，子评论与父评论正文左对齐 */
        indent: avatar.size + avatar.gap,
    }
}

/**
 * 视频评论树节点逻辑 —— 从 Comment 数据派生子评论计数、加载状态等纯计算属性。
 * 与 DOM / 模板解耦，可独立测试和复用。
 */
export function useVideoComment(comment: Ref<VideoComment>) {
    /** 已加载的直接子评论数 */
    const loadedChildCount = computed(() => comment.value.childCommentList?.length ?? 0)

    /** 还有多少条直接子评论未加载 */
    const remainingCount = computed(() => {
        const replyCount = comment.value.replyCount ?? 0
        const diff = replyCount - loadedChildCount.value
        return diff > 0 ? diff : 0
    })

    /** 是否还有更多子评论需要加载 */
    const hasMoreToLoad = computed(() => {
        return comment.value.hasMoreChildren || remainingCount.value > 0
    })

    /** 是否有可见的子内容（已加载的子评论 或 加载更多入口） */
    const hasChildrenContent = computed(() => {
        return loadedChildCount.value > 0 || hasMoreToLoad.value
    })

    return {
        loadedChildCount,
        remainingCount,
        hasMoreToLoad,
        hasChildrenContent,
    }
}
