import { computed, type Ref } from 'vue'
import type { VideoComment } from '@/shared/model/VideoComment'

/** 头像半径 = 头像尺寸(64px)的一半，用于竖线高度计算 */
export const AVATAR_HALF = 32
/** 连线圆角半径，需与 SCSS $corner-radius 保持一致 */
export const CORNER_RADIUS = 12

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
