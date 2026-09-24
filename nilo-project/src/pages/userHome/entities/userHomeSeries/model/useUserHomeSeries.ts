import { UserHomeSharedApi } from "@/pages/userHome/shared/api/UserHomeSharedApi";
import type { VideoSeriesWithVideos } from "@/pages/userHome/shared/model/VideoSeriesWithVideos";
import { useHostUserDetailStore } from "@/shared/store/HostUserDetailStore";
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";

/** 首页每个系列露出的视频数，正好一行 */
const PREVIEW_VIDEO_COUNT = 5;

export function useUserHomeSeries() {
  /* ——————工具—————— */
  const hostUserDetailStore = useHostUserDetailStore();
  const route = useRoute();

  /* ——————数据源—————— */

  const videoSeriesWithVideos = ref<VideoSeriesWithVideos[]>([]);

  /* ——————状态—————— */
  const loading = ref(true);

  /** 首页只展示有视频的系列 */
  const visibleSeries = computed(() =>
    videoSeriesWithVideos.value
      .filter(series => (series.videoInfoList?.length ?? 0) > 0)
      .map(series => ({
        ...series,
        videoInfoList: (series.videoInfoList ?? []).slice(0, PREVIEW_VIDEO_COUNT),
      })),
  );

  const hasSeries = computed(() => visibleSeries.value.length > 0);

  /* ——————初始化—————— */

  async function loadVideoSeriesWithVideos() {
    loading.value = true;
    const result = await UserHomeSharedApi.loadSeriesWithVideos(
      route.params.userId as string,
    );
    loading.value = false;

    if (result === false) {
      return;
    }

    videoSeriesWithVideos.value = result ?? [];
    // 顺带把标签栏上的系列数填上
    hostUserDetailStore.setCount("series", videoSeriesWithVideos.value.length);
  }

  onMounted(() => {
    loadVideoSeriesWithVideos();
  });

  return {
    visibleSeries,
    hasSeries,
    loading,
  };
}
