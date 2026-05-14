import { defineStore } from "pinia";
import type { VideoInfo } from "@/shared/model/VideoInfo";

const useVideoUploadEditStore = defineStore("videoUploadEdit", {
  state() {
    return {
      editVideoInfo: null as VideoInfo | null,
    };
  },
  actions: {
    setEditVideoInfo(videoInfo: VideoInfo) {
      this.editVideoInfo = videoInfo;
    },
    clearEditVideoInfo() {
      this.editVideoInfo = null;
    },
  },
});

export default useVideoUploadEditStore;
