import useVideoStateStore from "@/pages/videoDetail/store/VideoStateStore";
import { Api } from "@/shared/config/Api";
import request from "@/shared/lib/request";
import { useRoute, useRouter } from "vue-router";

export function useVideoFile() {
    const route = useRoute()
    const router = useRouter()
    const videoStateStore = useVideoStateStore()

    async function loadVideoFileList() {
        const result = await request({
            method: 'get',
            url: Api.loadVideoFileList + "/" + route.params.videoId,
        })
        if (!result) {
            return
        }
        videoStateStore.setVideoFileList(result.data)
    }

    function selectVideo(index: number) {
        router.push({
            name: "video",
            params: {
                videoId: route.params.videoId,
                index: index
            }
        })
    }

    return {
        loadVideoFileList,
        selectVideo,
    }
}