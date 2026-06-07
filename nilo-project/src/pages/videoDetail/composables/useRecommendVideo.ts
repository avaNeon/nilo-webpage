import { computed, ref, watch } from "vue";
import { VideoSearchApi } from "@/shared/api/VideoSearchApi";
import type { VideoInfo } from "@/shared/model/VideoInfo";
import type { VideoInfoDoc } from "@/shared/model/VideoInfoDoc";
import useVideoStateStore from "../store/VideoStateStore";

export function useRecommendVideo() {
  const videoStateStore = useVideoStateStore();
  const recommendVideoList = ref<VideoInfo[]>([]);
  let lastRequestKey = "";

  const currentVideoId = computed(() => videoStateStore.videoInfo?.videoId);
  const currentVideoName = computed(() => videoStateStore.videoInfo?.videoName);

  function toVideoInfo(videoInfoDoc: VideoInfoDoc): VideoInfo {
    return {
      videoId: videoInfoDoc.videoId,
      videoCover: videoInfoDoc.videoCover,
      videoName: videoInfoDoc.videoName,
      briefUserInfo: videoInfoDoc.briefUserInfo,
      userInfo: null,
      createTime: null,
      lastUpdateTime: videoInfoDoc.lastUpdateTime,
      pCategoryNumber: null,
      categoryNumber: videoInfoDoc.categoryNumber,
      postType: null,
      originInfo: null,
      tags: videoInfoDoc.tags,
      introduction: null,
      interaction: null,
      duration: videoInfoDoc.duration,
      playCount: videoInfoDoc.playCount,
      likeCount: null,
      danmakuCount: videoInfoDoc.danmakuCount,
      commentCount: null,
      coinCount: null,
      collectCount: videoInfoDoc.collectCount,
      status: null,
    };
  }

  async function loadRecommendVideo() {
    const videoId = currentVideoId.value;
    const videoName = currentVideoName.value?.trim();
    if (!videoId || !videoName) {
      recommendVideoList.value = [];
      return;
    }

    const requestKey = `${videoId}:${videoName}`;
    if (requestKey === lastRequestKey) {
      return;
    }
    lastRequestKey = requestKey;

    const loadedVideoList = await VideoSearchApi.searchRecommendVideo(
      videoId,
      videoName,
    );
    recommendVideoList.value =
      loadedVideoList?.map(videoInfoDoc => toVideoInfo(videoInfoDoc)) ?? [];
  }

  watch(
    [currentVideoId, currentVideoName],
    () => {
      loadRecommendVideo();
    },
    { immediate: true },
  );

  return {
    recommendVideoList,
    loadRecommendVideo,
  };
}
