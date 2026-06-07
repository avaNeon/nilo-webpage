import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import { VideoSearchApi } from "@/shared/api/VideoSearchApi";
import type { VideoInfo } from "@/shared/model/VideoInfo";
import type { VideoInfoDoc } from "@/shared/model/VideoInfoDoc";

export const VideoSearchOrderType = {
  COMPREHENSIVE: 1,
  NEWEST: 2,
  MOST_PLAYED: 3,
  MOST_COLLECTED: 4,
  MOST_DANMAKU: 5,
} as const;

export type VideoSearchOrderType =
  (typeof VideoSearchOrderType)[keyof typeof VideoSearchOrderType];

export function useVideoSearch() {
  const route = useRoute();

  const orderTypeOptions = [
    {
      label: "综合排序",
      value: VideoSearchOrderType.COMPREHENSIVE,
    },
    {
      label: "最新视频",
      value: VideoSearchOrderType.NEWEST,
    },
    {
      label: "最多播放",
      value: VideoSearchOrderType.MOST_PLAYED,
    },
    {
      label: "最多收藏",
      value: VideoSearchOrderType.MOST_COLLECTED,
    },
    {
      label: "最多弹幕",
      value: VideoSearchOrderType.MOST_DANMAKU,
    },
  ];

  const activeOrderType = ref<VideoSearchOrderType>(
    VideoSearchOrderType.COMPREHENSIVE,
  );
  const videoList = ref<VideoInfo[]>([]);
  const pageNo = ref(1);
  const pageSize = ref(20);
  const totalCount = ref(0);

  function getRouteKeyword() {
    const keyword = route.params.keyword;
    if (Array.isArray(keyword)) {
      return keyword[0] ?? "";
    }
    return keyword ?? "";
  }

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

  async function searchVideo(nextPageNo = 1) {
    const keyword = getRouteKeyword().trim();
    if (!keyword) {
      videoList.value = [];
      totalCount.value = 0;
      pageNo.value = 1;
      return;
    }

    pageNo.value = nextPageNo;
    const searchResult = await VideoSearchApi.searchVideo(
      activeOrderType.value,
      pageNo.value,
      pageSize.value,
      keyword,
    );

    videoList.value =
      searchResult?.videoInfoDocList.map(item => toVideoInfo(item)) ?? [];
    totalCount.value = searchResult?.pageCalculator.countTotal ?? 0;
  }

  function selectOrderType(orderType: VideoSearchOrderType) {
    activeOrderType.value = orderType;
    searchVideo(1);
  }

  watch(
    () => route.params.keyword,
    () => {
      searchVideo(1);
    },
    { immediate: true },
  );

  return {
    orderTypeOptions,
    activeOrderType,
    videoList,
    pageNo,
    pageSize,
    totalCount,
    searchVideo,
    selectOrderType,
  };
}
