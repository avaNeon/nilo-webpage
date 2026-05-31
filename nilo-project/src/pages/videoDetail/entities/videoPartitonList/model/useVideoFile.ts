import useVideoStateStore from "@/pages/videoDetail/store/VideoStateStore";
import { videoFileApi } from "@/shared/api/VideoFileApi";
import { useRoute, useRouter } from "vue-router";

export function useVideoFile() {
    const route = useRoute()
    const router = useRouter()
    const videoStateStore = useVideoStateStore()

    async function loadVideoFileList() {
        const videoId = String(route.params.videoId ?? "")
        if (!videoId) {
            return
        }
        const result = await videoFileApi.loadVideoFileList(videoId)
        if (!result) return
        videoStateStore.setVideoFileList(result)
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
