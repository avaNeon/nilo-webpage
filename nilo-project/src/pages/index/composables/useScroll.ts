import { ref, type Ref } from "vue"
import type { VideoList } from "@/shared/model/VideoList"
import useCategoryStore from "@/shared/store/CategoryStore"

/**
 * 滚动条相关业务逻辑
 */
export function useScroll(videoList: Ref<VideoList | undefined>, isLoading: Ref<boolean>, loadVideoList: () => Promise<void>) {
    /**
     * 判断是否固定顶部变量
     */
    const headerFixed = ref(false)
    /**
     * 不透明度
     */
    const headerOpacity = ref(0)
    /**
     * category 是否折叠
     */
    const categoryFolded = ref(false)
    /**
     * sub-category 是否折叠
     */
    const subCategoryFolded = ref(false)

    const categoryStore = useCategoryStore()

    const formerScroll = ref(0)

    /**
     * 设置顶栏是否固定
     */
    function setHeaderBarFixed() {
        if (scrollY <= 30) {
            headerFixed.value = false
            headerOpacity.value = 0
        }
        else {
            headerFixed.value = true
            // 计算不透明度：从 30px 开始出现，到 100px 达到 100%
            // (scrollY - 30) / (100 - 30)
            let opacity = (scrollY - 30) / 70
            headerOpacity.value = Math.min(1, Math.max(0, opacity))
        }
    }

    /**
     * 设置分类栏折叠状态
     * @param foldedHeight 折叠高度
     * @param valid 是否折叠
     */
    function setCategoryFolded(foldedHeight: number, valid: boolean) {
        // 当滚动高度超过 banner 高度时（这里是 200px），让 category 折叠
        // 也可以根据实际高度微调这个值
        categoryFolded.value = valid && scrollY > foldedHeight
    }

    /**
     * 设置子分类栏折叠状态
     * @param foldedHeight 折叠高度
     */
    function setSubCategoryFolded(foldedHeight: number) {
        const isScrollingDown = scrollY > formerScroll.value
        formerScroll.value = scrollY
        if (isScrollingDown && scrollY > foldedHeight) {
            subCategoryFolded.value = true
        }
        else {
            subCategoryFolded.value = false
        }
    }

    function checkVideoLoad(limitHeight: number) {
        // 如果没在加载，且还有的视频加载，并且离底部有一定距离了，就加载下一页
        if (videoList.value && !isLoading.value && (videoList.value.pageNo < videoList.value.pageTotal) && (innerHeight + scrollY >= document.body.offsetHeight - limitHeight)) {
            videoList.value.pageNo++
            loadVideoList()
        }
    }

    /**
     * 滚动监听函数
     */
    function scrollChecker() {
        // header-bar fixed
        setHeaderBarFixed()

        const foldedHeight = 250

        // category-banner folded
        setCategoryFolded(foldedHeight, !categoryStore.currentPCategory)

        // sub-category-banner folded
        setSubCategoryFolded(foldedHeight)

        /**
         * 加载限制高度
         * 因为一个视频大概是204px高度，算上视频之间的间隔，这个高度大概是底部显示两行视频的高度多一点
         */
        const limitHeight = 430

        // video load
        checkVideoLoad(limitHeight)

    }

    return {
        headerFixed,
        categoryFolded,
        subCategoryFolded,
        headerOpacity,
        scrollChecker
    }
}