import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { VideoSearchApi } from "@/shared/api/VideoSearchApi";
import type { VideoInfo } from "@/shared/model/VideoInfo";
import type { VideoInfoDoc } from "@/shared/model/VideoInfoDoc";
import { setPageTitle } from "@/shared/utils/PageTitle";

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
      label: "最新发布",
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
  /** 请求进行中：首次显示骨架屏，翻页/换排序时结果区变淡 */
  const loading = ref(false);
  // 连续切换排序/翻页时只认最后一次请求的结果
  let requestSeq = 0;

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

  const keyword = computed(() => getRouteKeyword().trim());

  async function searchVideo(nextPageNo = 1) {
    const currentSeq = ++requestSeq;
    if (!keyword.value) {
      videoList.value = [];
      totalCount.value = 0;
      pageNo.value = 1;
      loading.value = false;
      return;
    }

    pageNo.value = nextPageNo;
    loading.value = true;
    try {
      const searchResult = await VideoSearchApi.searchVideo(
        activeOrderType.value,
        pageNo.value,
        pageSize.value,
        keyword.value,
      );
      if (currentSeq !== requestSeq) return;

      videoList.value =
        searchResult?.videoInfoDocList.map(item => toVideoInfo(item)) ?? [];
      totalCount.value = searchResult?.pageCalculator.countTotal ?? 0;
    } finally {
      if (currentSeq === requestSeq) {
        loading.value = false;
      }
    }
  }

  function selectOrderType(orderType: VideoSearchOrderType) {
    activeOrderType.value = orderType;
    searchVideo(1);
  }

  watch(
    () => route.params.keyword,
    () => {
      setPageTitle(keyword.value ? `搜索：${keyword.value}` : "搜索");
      searchVideo(1);
    },
    { immediate: true },
  );

  return {
    keyword,
    loading,
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
