import { UserHomeSharedApi } from "@/pages/userHome/shared/api/UserHomeSharedApi";
import type { VideoInfo } from "@/shared/model/VideoInfo";
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";

export function useUserHomeVideoList() {
  const route = useRoute();

  const hasVideo = computed(
    () => videoInfoList.value !== null && videoInfoList.value.length > 0,
  );

  const videoInfoList = ref<VideoInfo[]>([]);
  const count = ref<number | null>(null);

  /* ——————初始化—————— */

  async function loadVideoInfoList() {
    const result = await UserHomeSharedApi.loadVideo(
      route.params.userId as string,
      1,
      10,
    );

    if (
      result === null ||
      result === false ||
      result.list === null ||
      result.list.length === 0
    ) {
      return;
    }

    videoInfoList.value = result.list;
    count.value = result.totalCount;
  }

  onMounted(() => {
    loadVideoInfoList();
  });

  return { videoInfoList, hasVideo, count };
}
