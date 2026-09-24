import { Api } from "@/shared/config/Api"
import { CAROUSEL_VIDEO_COUNT } from "@/shared/config/Config"
import request from "@/shared/lib/request"
import type { VideoInfo } from "@/shared/model/VideoInfo"
import { computed, ref } from "vue"

/** 「为你推荐」最多展示的视频数（两行） */
const FOR_YOU_VIDEO_COUNT = 8

/**
 * 首页推荐视频：一次请求，前几个给顶部轮播，剩下的给「为你推荐」
 */
export function useRecommendVideos() {
    const recommendVideoList = ref<VideoInfo[]>([])
    const isLoading = ref(true)

    const heroSlides = computed(() => recommendVideoList.value.slice(0, CAROUSEL_VIDEO_COUNT))
    const forYouVideos = computed(() =>
        recommendVideoList.value.slice(CAROUSEL_VIDEO_COUNT, CAROUSEL_VIDEO_COUNT + FOR_YOU_VIDEO_COUNT))

    async function loadRecommendVideos() {
        isLoading.value = true
        const result = await request({ method: 'get', url: Api.loadRecommendVideo })
        const list: VideoInfo[] = Array.isArray(result?.data) ? result.data : []
        recommendVideoList.value = list.filter(videoInfo => videoInfo?.videoId)
        isLoading.value = false
    }

    return {
        heroSlides,
        forYouVideos,
        isLoading,
        loadRecommendVideos,
    }
}
