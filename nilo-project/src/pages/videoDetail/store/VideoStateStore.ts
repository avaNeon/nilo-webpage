import type { VideoInfoFile } from "@/features/player/model/VideoInfoFIle";
import type { VideoInfo } from "@/shared/model/VideoInfo";
import { defineStore } from "pinia";

const useVideoStateStore = defineStore('videoState', {
    state() {
        return {
            displayMode: 'normal' as 'normal' | 'theater',
            videoInfo: {} as VideoInfo,
            videoFileList: [] as VideoInfoFile[],
            autoPlay: true as boolean,
        }
    },
    actions: {
        setDisplayMode(mode: 'normal' | 'theater') {
            this.displayMode = mode
        },
        setVideoInfo(info: VideoInfo) {
            this.videoInfo = info
        },
        setVideoFileList(fileList: VideoInfoFile[]) {
            this.videoFileList = fileList
        },
        setAutoPlay(auto: boolean) {
            this.autoPlay = auto
        },
    }
})

export default useVideoStateStore