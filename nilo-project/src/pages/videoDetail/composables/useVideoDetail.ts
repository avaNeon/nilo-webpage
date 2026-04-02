import { Api } from "@/shared/config/Api";
import request from "@/shared/lib/request";
import type { VideoInfo } from "@/shared/model/VideoInfo";
import { ref } from "vue";

export function useVideoDetail() {
    const videoInfo = ref<VideoInfo | null>(null)
    const avatarUrl = ref<string>('')

    async function loadVideoInfo(videoId: string) {
        const result = await request({
            method: 'get',
            url: Api.loadVideoInfo + `/${videoId}`,
        })
        if(!result) {
            return
        }
        videoInfo.value = result.data
        avatarUrl.value = videoInfo.value?.userInfo?.avatar ? videoInfo.value.userInfo.avatar : ''

        console.log(avatarUrl.value)
    }

    return { videoInfo, avatarUrl, loadVideoInfo }
}