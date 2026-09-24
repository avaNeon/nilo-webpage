import { HotVideoApi } from '@/shared/api/HotVideoApi'
import type { VideoInfo } from '@/shared/model/VideoInfo'
import { onMounted, ref } from 'vue'

// 首页只展示 24 小时热门视频的前几名（接口一页返回 20 条，取第一页即可）
export const HOT_VIDEO_TOP_COUNT = 5

export function useHotVideoTop()
{
    const hotVideoList = ref<VideoInfo[]>([])
    const hotVideoLoading = ref(true)

    async function loadHotVideoTop()
    {
        hotVideoLoading.value = true
        try
        {
            const loadedList = await HotVideoApi.loadHotVideo(1)
            hotVideoList.value = (loadedList ?? [])
                .filter(videoInfo => videoInfo?.videoId)
                .slice(0, HOT_VIDEO_TOP_COUNT)
        }
        finally
        {
            hotVideoLoading.value = false
        }
    }

    onMounted(() =>
    {
        void loadHotVideoTop()
    })

    return {
        hotVideoList,
        hotVideoLoading,
    }
}
