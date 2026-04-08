import { Api } from "@/shared/config/Api";
import request from "@/shared/lib/request";
import { ref } from "vue";
import useVideoStateStore from "../store/VideoStateStore";

export function useVideoDetail() {
    const videoStateStore = useVideoStateStore()
    const avatarUrl = ref<string>('')

    async function loadVideoInfo(videoId: string) {
        const result = await request({
            method: 'get',
            url: Api.loadVideoInfo + `/${videoId}`,
        })
        if(!result) {
            return
        }
        videoStateStore.setVideoInfo(result.data)
        avatarUrl.value = videoStateStore.videoInfo.userInfo?.avatar ? videoStateStore.videoInfo.userInfo.avatar : ''
    }

    return { avatarUrl, loadVideoInfo }
}