import type { VideoInfo } from "@/shared/model/VideoInfo"
import { Api } from "@/shared/config/Api"
import { CAROUSEL_VIDEO_COUNT } from "@/shared/config/Config"
import request from "@/shared/lib/request"
import { ref } from "vue"

export function useVideo() {
    const carouselVideoList = ref<VideoInfo[]>([])
    const recommendVideoList = ref<VideoInfo[]>([])

    // 加载推荐视频列表
    async function loadRecommendVideos() {
        const result = await request({ method: 'get', url: Api.loadRecommendVideo })
        if (!result) {
            return
        }
        const data: VideoInfo[] = result.data
        if (data.length > CAROUSEL_VIDEO_COUNT) {
            carouselVideoList.value = data.splice(0, CAROUSEL_VIDEO_COUNT)
            recommendVideoList.value = data.splice(0, 6) // 右边最多展示6个视频
        }
        else {
            carouselVideoList.value = data
        }
    }

    return {
        carouselVideoList,
        recommendVideoList,
        loadRecommendVideos
    }
}