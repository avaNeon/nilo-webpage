import { onBeforeUnmount, onMounted, reactive } from "vue";
import type { VideoInfo } from "@/shared/model/VideoInfo";
import { HotRankingApi } from "../api/HotRankingApi";

export function useHotRanking() {
  /* ————————状态———————— */

  const hotRankingState = reactive({
    videoList: [] as VideoInfo[],
    pageNo: 1,
    loading: false,
    finished: false,
  });

  let scrollTicking = false;

  /* ————————方法———————— */

  async function loadHotVideoList() {
    if (hotRankingState.loading || hotRankingState.finished) return;

    hotRankingState.loading = true;
    try {
      const loadedList = await HotRankingApi.loadHotVideo(
        hotRankingState.pageNo,
      );

      if (!loadedList || loadedList.length === 0) {
        hotRankingState.finished = true;
        return;
      }

      hotRankingState.videoList.push(...loadedList);
      hotRankingState.pageNo++;
    } finally {
      hotRankingState.loading = false;
      requestAnimationFrame(checkShouldLoadMore);
    }
  }

  function checkShouldLoadMore() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    const viewportHeight = window.innerHeight;
    const scrollHeight = document.documentElement.scrollHeight;

    if (scrollTop + viewportHeight >= scrollHeight - 240) {
      void loadHotVideoList();
    }
  }

  function handleScroll() {
    if (scrollTicking) return;

    scrollTicking = true;
    requestAnimationFrame(() => {
      checkShouldLoadMore();
      scrollTicking = false;
    });
  }

  /* ————————初始化———————— */

  onMounted(() => {
    void loadHotVideoList();
    window.addEventListener("scroll", handleScroll, { passive: true });
  });

  onBeforeUnmount(() => {
    window.removeEventListener("scroll", handleScroll);
  });

  return {
    hotRankingState,
    videoList: hotRankingState.videoList,
    loadHotVideoList,
  };
}
