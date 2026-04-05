import useCategoryStore from '@/shared/store/CategoryStore'
import type { VideoInfo } from '@/shared/model/VideoInfo'

const DEFAULT_RIPPLE_COLOR = '#3b394c'

export function useVideoItemRipple() {
    const categoryStore = useCategoryStore()

    function getRippleStyle(videoInfo: VideoInfo) {
        const pCatNum = videoInfo.pCategoryNumber
        const catNum = videoInfo.categoryNumber
        // pCategoryNumber 为 null 时，视频属于一级分类，用 categoryNumber 查找
        // pCategoryNumber 不为 null 时，视频属于子分类，用 pCategoryNumber 查找一级分类
        const primaryNum = (pCatNum == null) ? catNum : pCatNum
        const color = primaryNum != null
            ? (categoryStore.categoryMap[primaryNum]?.color ?? DEFAULT_RIPPLE_COLOR)
            : DEFAULT_RIPPLE_COLOR
        return {
            '--ripple-color': color + 'A0',
        } as Record<string, string>
    }

    return {
        getRippleStyle,
    }
}
