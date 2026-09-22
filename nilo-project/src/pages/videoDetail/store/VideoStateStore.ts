import type { VideoInfoFile } from "@/shared/model/VideoInfoFIle";
import type { VideoInfo } from "@/shared/model/VideoInfo";
import { defineStore } from "pinia";

const useVideoStateStore = defineStore('videoState', {
    state() {
        return {
            displayMode: 'normal' as 'normal' | 'theater',
            videoInfo: {} as VideoInfo,
            videoFileList: [] as VideoInfoFile[],
            autoPlay: true as boolean,
            /** 页面其他地方请求播放器跳到某个分 P 的某一秒（例如 AI 助手的片段）；nonce 保证重复点同一个时间点也能触发 */
            seekRequest: null as { fileIndex: number; sec: number; nonce: number } | null,
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
        requestSeek(fileIndex: number, sec: number) {
            this.seekRequest = {
                fileIndex,
                sec,
                nonce: (this.seekRequest?.nonce ?? 0) + 1,
            }
        },
    }
})

export default useVideoStateStore