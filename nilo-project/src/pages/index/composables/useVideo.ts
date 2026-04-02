import { Api } from "@/shared/config/Api";
import request from "@/shared/lib/request";
import { ref, watch } from "vue";
import type { VideoList } from "../../../shared/model/VideoList";
import type { VideoInfo } from "@/shared/model/VideoInfo";
import useCategoryStore from "@/shared/store/CategoryStore";

export function useVideo() {
    const defaultVideoList: VideoList = {
        totalCount: 0,
        pageSize: 10,
        pageNo: 0,
        pageTotal: 0,
        list: [],
    }
    const videoList = ref<VideoList>(defaultVideoList)
    const isLoading = ref<boolean>(false)

    const categoryStore = useCategoryStore()

    async function loadVideoList() {
        // 如果分类数据还没加载好，先不执行加载逻辑
        if (!categoryStore.isInited) {
            return
        }

        // debug: 等待1秒
        // await new Promise(resolve => setTimeout(resolve, 1000))

        const categoryNumber = categoryStore.currentCategoryNumber || categoryStore.currentPCategory?.categoryNumber

        const params = {
            pageNo: videoList.value?.pageNo || 1,
            categoryNumber,
            isRecommend: categoryNumber ? undefined : false, // 如果没有分类，说明在首页，只加载非推荐视频
        }

        isLoading.value = true
        const result = await request({
            method: "get",
            url: Api.loadVideoInfo,
            params,
        })
        isLoading.value = false
        if (!result) {
            return
        }
        const preservedList: VideoInfo[] = videoList.value?.list || []
        videoList.value = Object.assign({}, result.data)
        if (result.data.pageNo > 1 && videoList.value) {
            videoList.value.list = preservedList.concat(result.data.list)
        }
    }

    // 在分类加载完毕后执行一次
    watch(() => categoryStore.isInited, (isInited) => {
        if (isInited) {
            loadVideoList()
        }
    })

    // 监听分类变化，自动在分类变化时加载一次视频列表
    // 异步路径 categoryStore加载（异步）-> categoryStore.currentPCategory，() => categoryStore.currentCategoryNumber根据路由变化-> 如果路由有变化，执行loadVideoList
    watch([() => categoryStore.currentPCategory, () => categoryStore.currentCategoryNumber], () => {
        // 切换分类了，就不能保留原来加载的视频了，必须重新加载
        videoList.value = { ...defaultVideoList }
        loadVideoList()
    }, { immediate: true })

    return {
        videoList,
        isLoading,
        loadVideoList,
    }
}