import { UserHomeSharedApi } from "@/pages/userHome/shared/api/UserHomeSharedApi";
import { UserHomeVideoSeriesApi } from "@/pages/userHome/widgets/userHomeVideoSeries/api/UserHomeVideoSeriesApi";
import message from "@/shared/lib/message";
import type { VideoInfo } from "@/shared/model/VideoInfo";
import { ref } from "vue";
import { useRoute } from "vue-router";

export function useVideoSeriesEditor() {
  /* ——————工具—————— */
  const route = useRoute();

  /* ——————表单—————— */
  const title = ref("");
  const description = ref("");

  /* ——————数据—————— */
  /** 待选择的视频 */
  const videoList = ref<VideoInfo[]>([]);

  /* ——————状态—————— */

  // 数据源状态，不用清理
  const pageNo = ref(0);
  const lastPageAcceeded = ref(false);

  const step = ref(1);
  const videoLoading = ref(false);
  const addedVideoList = ref<string[]>([]);
  const seriesId = ref<string | undefined>(undefined);

  /** 不在系列中的视频数量 */
  const excludedVideoCount = ref(0);
  /** 要添加的视频数量，用于点击后置顶 */
  const addedVideoLength = ref(0)

  /* ——————方法—————— */
  function validateForm() {
    if (title.value.trim().length > 0) {
      step.value = 2;
      loadNextPageVideos();
    } else {
      message.warning("标题不能为空");
    }
  }

  /** 加载视频 */
  async function loadNextPageVideos() {
    if (lastPageAcceeded.value || videoLoading.value) {
      return;
    }

    videoLoading.value = true;
    pageNo.value++;

    try {
      // 添加视频
      if (seriesId.value) {
        const result =
          await UserHomeVideoSeriesApi.loadMoreVideoExcludingSeries(
            seriesId.value as string,
            pageNo.value,
          );

        if (result === false) {
          pageNo.value--;
          return;
        }

        if (result === null || result.length === 0) {
          lastPageAcceeded.value = true;
          return;
        }

        videoList.value.push(...result);
      }
      // 新增系列
      else {
        const result = await UserHomeSharedApi.loadVideo(
          route.params.userId as string,
          pageNo.value,
          20,
          1,
        );

        if (result === false || result === null) {
          pageNo.value--;
          return;
        }

        if (result.list === null || result.list.length === 0) {
          lastPageAcceeded.value = true;
          return;
        }

        videoList.value.push(...result.list);
      }
    } finally {
      videoLoading.value = false;
    }
  }

  /** 加载可以添加的视频数量 */
  async function loadAvailableVideoCount() {
    if (seriesId.value) {
      const result = await UserHomeVideoSeriesApi.getVideoExcludingSeries(
        seriesId.value,
      );

      if (result === null) {
        excludedVideoCount.value = 0;
      } else {
        excludedVideoCount.value = result;
      }
    }
  }

  function clear() {
    title.value = "";
    description.value = "";
    videoList.value = [];
    pageNo.value = 0;
    lastPageAcceeded.value = false;
    step.value = 1;
    videoLoading.value = false;
    addedVideoList.value = [];
    addedVideoLength.value = 0;
    excludedVideoCount.value = 0;
  }

  function addVideo(videoId: string) {
    addedVideoList.value.push(videoId);
  }

  function removeVideo(videoId: string) {
    addedVideoList.value = addedVideoList.value.filter(id => id !== videoId);
  }

  return {
    title,
    description,
    step,
    videoList,
    loadingVideos: videoLoading,
    addedVideoList,
    seriesId,
    excludedVideoCount,
    addedVideoLength,
    validateForm,
    loadNextPageVideos,
    clear,
    addVideo,
    removeVideo,
    loadAvailableVideoCount,
  };
}
