import { UserHomeSharedApi } from "@/pages/userHome/shared/api/UserHomeSharedApi";
import type { VideoSeriesWithVideos } from "@/pages/userHome/shared/model/VideoSeriesWithVideos";
import { useHostUserDetailStore } from "@/shared/store/HostUserDetailStore";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

export function useUserHomeSeries() {
  /* ——————工具—————— */
  const hostUserDetailStore = useHostUserDetailStore();
  const route = useRoute();

  /* ——————数据源—————— */

  const videoSeriesWithVideos = ref<VideoSeriesWithVideos[]>([]);

  /* ——————状态—————— */
  const showSeriesEditor = ref(false);

  /* ——————方法—————— */

  const hasSeries = computed(() => {
    if (
      videoSeriesWithVideos.value !== null &&
      videoSeriesWithVideos.value.length > 0
    ) {
      for (const videoSerie of videoSeriesWithVideos.value) {
        // 如果至少有一个系列包含至少一个视频，那么就算不为空
        if (
          videoSerie.videoInfoList !== null &&
          videoSerie.videoInfoList.length > 0
        ) {
          return true;
        }
      }
      // 如果尽管存在系列，但是没有包含视频的系列，那么也算为空
      return false;
    } else {
      return false;
    }
  });

  /* ——————初始化—————— */

  function fillHostBriefUserInfo(seriesList: VideoSeriesWithVideos[]) {
    const hostUserDetail = hostUserDetailStore.userHostDetail;
    const hostBriefUserInfo =
      hostUserDetail !== null &&
      hostUserDetail.userId !== null &&
      hostUserDetail.nickName !== null
        ? {
            userId: hostUserDetail.userId,
            nickName: hostUserDetail.nickName,
            avatar: hostUserDetail.avatar ?? "",
            personalIntroduction: hostUserDetail.personalIntroduction ?? "",
          }
        : null;

    if (hostBriefUserInfo === null) {
      return;
    }

    for (const videoSeries of seriesList) {
      for (const videoInfo of videoSeries.videoInfoList ?? []) {
        videoInfo.briefUserInfo = hostBriefUserInfo;
      }
    }
  }

  async function loadVideoSeriesWithVideos() {
    const result = await UserHomeSharedApi.loadSeriesWithVideos(
      route.params.userId as string,
    );

    if (result === null || result === false) {
      return;
    }

    fillHostBriefUserInfo(result);

    videoSeriesWithVideos.value = result;
  }

  watch(
    () => hostUserDetailStore.userHostDetail,
    () => fillHostBriefUserInfo(videoSeriesWithVideos.value),
  );

  onMounted(() => {
    loadVideoSeriesWithVideos();
  });

  return {
    videoSeriesWithVideos,
    hasSeries,
    showSeriesEditor,
  };
}
