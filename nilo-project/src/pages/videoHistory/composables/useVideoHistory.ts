import { onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import dayjs from "dayjs";
import { VideoPlayHistoryApi } from "@/shared/api/VideoPlayHistoryApi";
import message from "@/shared/lib/message";
import type { VideoPlayHistory } from "@/shared/model/VideoPlayHistory";
import type { VideoInfo } from "@/shared/model/VideoInfo";
import type { VideoHistoryItem } from "../model/VideoHistoryGroup";

function getTimelineDate(dateTime: string) {
  const parsedDateTime = dayjs(dateTime);
  return parsedDateTime.isValid()
    ? parsedDateTime.format("YYYY-MM-DD")
    : "unknown";
}

function getTimelineDayLabel(dateTime: string) {
  const parsedDateTime = dayjs(dateTime);
  if (!parsedDateTime.isValid()) return "未知日期";

  const today = dayjs().startOf("day");

  if (parsedDateTime.isSame(today, "day")) return "今天";
  if (parsedDateTime.isSame(today.subtract(1, "day"), "day")) return "昨天";

  return parsedDateTime.format("YYYY年M月D日");
}

export function useVideoHistory() {
  /* ————————数据源———————— */

  const historyList = ref<VideoPlayHistory[]>([]);
  const historyItemMap = reactive(new Map<string, VideoHistoryItem[]>());

  /* ————————状态———————— */

  const pageNo = ref(1);
  const loading = ref(false);
  const finished = ref(false);
  const deleting = ref(false);
  let scrollTicking = false;
  let handledHistoryCount = 0;

  /* ————————方法———————— */

  function toVideoInfo(history: VideoPlayHistory): VideoInfo {
    return {
      videoId: history.videoId,
      videoCover: history.videoCover,
      videoName: history.videoName,
      briefUserInfo: {
        userId: String(history.userId),
        nickName: history.nickName,
        avatar: "",
        personalIntroduction: "",
      },
      userInfo: null,
      createTime: null,
      lastUpdateTime: history.lastUpdateTime,
      pCategoryNumber: null,
      categoryNumber: null,
      postType: null,
      originInfo: null,
      tags: null,
      introduction: null,
      interaction: null,
      duration: null,
      playCount: null,
      likeCount: null,
      danmakuCount: null,
      commentCount: null,
      coinCount: null,
      collectCount: null,
      status: null,
    };
  }

  function toVideoHistoryItem(history: VideoPlayHistory): VideoHistoryItem {
    return {
      history,
      videoInfo: toVideoInfo(history),
    };
  }

  function appendHistoryItem(history: VideoPlayHistory) {
    const date = getTimelineDate(history.lastUpdateTime);
    const item = toVideoHistoryItem(history);
    const existingItems = historyItemMap.get(date);

    if (existingItems) {
      existingItems.push(item);
      return;
    }

    historyItemMap.set(date, [item]);
  }

  function removeHistoryItem(history: VideoPlayHistory) {
    const date = getTimelineDate(history.lastUpdateTime);
    const existingItems = historyItemMap.get(date);

    if (!existingItems) return;

    const nextItems = existingItems.filter(
      item =>
        !(
          item.history.videoId === history.videoId &&
          item.history.fileIndex === history.fileIndex &&
          item.history.lastUpdateTime === history.lastUpdateTime
        ),
    );

    if (nextItems.length > 0) {
      historyItemMap.set(date, nextItems);
    } else {
      historyItemMap.delete(date);
    }

    historyList.value = historyList.value.filter(
      item =>
        !(
          item.videoId === history.videoId &&
          item.fileIndex === history.fileIndex &&
          item.lastUpdateTime === history.lastUpdateTime
        ),
    );
    handledHistoryCount = historyList.value.length;
  }

  async function deleteHistoryItem(history: VideoPlayHistory) {
    if (deleting.value) return;

    deleting.value = true;
    try {
      const result = await VideoPlayHistoryApi.deleteHistory(
        history.videoId,
      );

      if (result?.code === 200) {
        removeHistoryItem(history);
        message.success("历史记录已删除");
      }
    } finally {
      deleting.value = false;
    }
  }

  async function deleteAllHistory() {
    if (deleting.value) return;

    deleting.value = true;
    try {
      const result = await VideoPlayHistoryApi.deleteAllHistory();

      if (result?.code === 200) {
        historyList.value = [];
        historyItemMap.clear();
        handledHistoryCount = 0;
        finished.value = true;
        message.success("全部历史记录已删除");
      }
    } finally {
      deleting.value = false;
    }
  }

  async function loadHistoryList() {
    if (loading.value || finished.value) return;

    loading.value = true;
    try {
      const loadedList = await VideoPlayHistoryApi.getHistoryList(pageNo.value);

      if (!loadedList || loadedList.length === 0) {
        finished.value = true;
        return;
      }

      historyList.value.push(...loadedList);
      pageNo.value++;
    } finally {
      loading.value = false;
      requestAnimationFrame(checkShouldLoadMore);
    }
  }

  function checkShouldLoadMore() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    const viewportHeight = window.innerHeight;
    const scrollHeight = document.documentElement.scrollHeight;

    if (scrollTop + viewportHeight >= scrollHeight - 240) {
      void loadHistoryList();
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

  watch(
    () => historyList.value.length,
    () => {
      const pendingList = historyList.value.slice(handledHistoryCount);

      pendingList.forEach(appendHistoryItem);
      handledHistoryCount = historyList.value.length;
    },
  );
  /* ————————初始化———————— */

  onMounted(() => {
    void loadHistoryList();
    window.addEventListener("scroll", handleScroll, { passive: true });
  });

  onBeforeUnmount(() => {
    window.removeEventListener("scroll", handleScroll);
  });

  return {
    historyItemMap,
    loading,
    finished,
    deleting,
    deleteHistoryItem,
    deleteAllHistory,
    getTimelineDayLabel,
  };
}
