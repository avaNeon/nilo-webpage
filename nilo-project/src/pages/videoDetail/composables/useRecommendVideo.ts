import { computed, ref, watch } from "vue";
import { Api } from "@/shared/config/Api";
import request from "@/shared/lib/request";
import { VideoSearchApi } from "@/shared/api/VideoSearchApi";
import type { VideoInfo } from "@/shared/model/VideoInfo";
import type { VideoInfoDoc } from "@/shared/model/VideoInfoDoc";
import useVideoStateStore from "../store/VideoStateStore";

/** 相关视频为空时，用首页推荐兜底，最多展示的条数 */
const FALLBACK_VIDEO_COUNT = 10;

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

  /** 兜底：首页推荐视频（去掉当前视频） */
  async function loadFallbackVideo(videoId: string): Promise<VideoInfo[]> {
    const result = await request({
      method: "get",
      url: Api.loadRecommendVideo,
      showError: false,
    });
    const list: VideoInfo[] = Array.isArray(result?.data) ? result.data : [];
    return list
      .filter(videoInfo => videoInfo?.videoId && videoInfo.videoId !== videoId)
      .slice(0, FALLBACK_VIDEO_COUNT);
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
    let videoList =
      loadedVideoList
        ?.map(videoInfoDoc => toVideoInfo(videoInfoDoc))
        .filter(videoInfo => videoInfo.videoId && videoInfo.videoId !== videoId) ?? [];
    // 相关视频经常为空，退回到首页推荐
    if (videoList.length === 0) {
      videoList = await loadFallbackVideo(videoId);
    }
    // 等待期间已经换了视频，丢弃旧结果
    if (requestKey !== lastRequestKey) {
      return;
    }
    recommendVideoList.value = videoList;
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
