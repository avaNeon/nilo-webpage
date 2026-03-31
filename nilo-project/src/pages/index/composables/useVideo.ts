import { Api } from "@/shared/config/Api";
import request from "@/shared/lib/request";
import { ref } from "vue";
import type { VideoList } from "../../../shared/model/VideoList";
import type { VideoInfo } from "@/shared/model/VideoInfo";
import useCategoryStore from "@/shared/store/CategoryStore";

export function useVideo() {
    const videoList = ref<VideoList>()
    const isLoading = ref<boolean>(false)

    const categoryStore = useCategoryStore()

    async function loadVideoList() {

        // debug: 等待0.1秒
        // await new Promise(resolve => setTimeout(resolve, 100))

        const params = {
            pageNo: videoList.value?.pageNo || 1,
            categoryNumber: categoryStore.currentCategoryNumber,
        }
        isLoading.value = true
        const result = await request({
            method: "get",
            url: Api.loadVideo,
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
    return {
        videoList,
        isLoading,
        loadVideoList,
    }
}