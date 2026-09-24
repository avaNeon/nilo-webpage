import { Api } from "@/shared/config/Api"
import request from "@/shared/lib/request"
import type { VideoInfo } from "@/shared/model/VideoInfo"
import type { VideoList } from "@/shared/model/VideoList"
import useCategoryStore from "@/shared/store/CategoryStore"
import { computed, ref, watch } from "vue"

/** 网格每行的卡片数，还有下一页时只展示整行 */
const GRID_COLUMN_COUNT = 4

/**
 * 首页「最新视频」：按当前分类倒序分页，手动点击加载更多
 */
export function useLatestVideos() {
    const categoryStore = useCategoryStore()

    const videoList = ref<VideoInfo[]>([])
    const pageNo = ref(0)
    const pageTotal = ref(0)
    /** 正在加载第一页（首次进入或切换分类） */
    const isSwitching = ref(false)
    /** 正在加载下一页 */
    const isLoadingMore = ref(false)
    /** 当前分类的第一页已经返回过（无论成功失败） */
    const isLoaded = ref(false)
    /** 最近一次请求失败 */
    const loadFailed = ref(false)

    // 请求序号：只认最后一次请求的响应，快速切换分类时丢弃过期结果
    let requestSeq = 0

    // 有子分类用子分类，否则用一级分类；首页为空
    const categoryNumber = computed(() =>
        categoryStore.currentCategoryNumber || categoryStore.currentPCategory?.categoryNumber || undefined)

    const hasMore = computed(() => pageNo.value < pageTotal.value)

    // 后端每页固定 10 条，还有下一页时把不满一行的部分先留着，避免最后一行参差
    const visibleVideoList = computed(() => {
        if (!hasMore.value) {
            return videoList.value
        }
        const count = Math.floor(videoList.value.length / GRID_COLUMN_COUNT) * GRID_COLUMN_COUNT
        return count > 0 ? videoList.value.slice(0, count) : videoList.value
    })

    async function loadPage(reset: boolean) {
        if (!categoryStore.isInited) {
            return
        }
        const seq = ++requestSeq
        const targetPageNo = reset ? 1 : pageNo.value + 1
        const category = categoryNumber.value

        isSwitching.value = reset
        isLoadingMore.value = !reset
        loadFailed.value = false
        if (reset) {
            isLoaded.value = false
        }

        const result = await request({
            method: 'get',
            url: Api.loadVideoInfo,
            params: {
                pageNo: targetPageNo,
                categoryNumber: category,
                isRecommend: category ? undefined : false, // 没有分类说明在首页，只加载非推荐视频
            },
        })
        if (seq !== requestSeq) {
            return
        }
        isSwitching.value = false
        isLoadingMore.value = false
        isLoaded.value = true

        const data = result?.data as VideoList | null | undefined
        if (!data) {
            loadFailed.value = true
            // 切换分类失败时不能继续显示上一个分类的视频
            if (reset) {
                videoList.value = []
                pageNo.value = 0
                pageTotal.value = 0
            }
            return
        }

        const list = data.list ?? []
        if (reset) {
            videoList.value = list
        }
        else {
            // 翻页期间有新投稿会让列表整体后移，去掉已经展示过的视频
            const loadedIds = new Set(videoList.value.map(videoInfo => videoInfo.videoId))
            videoList.value = videoList.value.concat(list.filter(videoInfo => !loadedIds.has(videoInfo.videoId)))
        }
        pageNo.value = data.pageNo || targetPageNo
        pageTotal.value = data.pageTotal ?? 0
    }

    function loadMore() {
        if (isSwitching.value || isLoadingMore.value || !hasMore.value) {
            return
        }
        loadPage(false)
    }

    function reload() {
        loadPage(true)
    }

    // 分类初始化完成、或分类（随路由）变化时，从第一页重新加载
    watch([() => categoryStore.isInited, categoryNumber], ([isInited]) => {
        if (isInited) {
            loadPage(true)
        }
    }, { immediate: true })

    return {
        videoList,
        visibleVideoList,
        hasMore,
        isSwitching,
        isLoadingMore,
        isLoaded,
        loadFailed,
        loadMore,
        reload,
    }
}
