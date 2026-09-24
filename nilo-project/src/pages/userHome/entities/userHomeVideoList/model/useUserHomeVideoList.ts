import { UserHomeSharedApi } from "@/pages/userHome/shared/api/UserHomeSharedApi";
import type { VideoInfo } from "@/shared/model/VideoInfo";
import { useHostUserDetailStore } from "@/shared/store/HostUserDetailStore";
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";

/** 首页展示两行 */
const PAGE_SIZE = 10;

export function useUserHomeVideoList() {
  const route = useRoute();
  const hostUserDetailStore = useHostUserDetailStore();

  const videoInfoList = ref<VideoInfo[]>([]);
  const count = ref<number | null>(null);
  const loading = ref(true);

  const hasVideo = computed(() => videoInfoList.value.length > 0);

  /* ——————初始化—————— */

  async function loadVideoInfoList() {
    loading.value = true;
    const result = await UserHomeSharedApi.loadVideo(
      route.params.userId as string,
      1,
      PAGE_SIZE,
    );
    loading.value = false;

    if (result === false) {
      return;
    }

    videoInfoList.value = result?.list ?? [];
    count.value = result?.totalCount ?? 0;
    // 顺带把标签栏上的投稿数填上
    hostUserDetailStore.setCount("upload", count.value);
  }

  onMounted(() => {
    loadVideoInfoList();
  });

  return { videoInfoList, hasVideo, count, loading };
}
