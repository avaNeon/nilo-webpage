import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import dayjs from "dayjs";
import { VideoPlayHistoryApi } from "@/shared/api/VideoPlayHistoryApi";
import message from "@/shared/lib/message";
import type { VideoPlayHistory } from "@/shared/model/VideoPlayHistory";
import type { VideoInfo } from "@/shared/model/VideoInfo";
import type { VideoHistoryItem } from "../model/VideoHistoryGroup";
import { parseBackendDateTime } from "@/shared/utils/DateUtil";

/** 点「清空全部」后，这段时间内可以撤销，过了才真正调接口 */
const CLEAR_UNDO_SECONDS = 6;

const WEEKDAY_LABELS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function getTimelineDate(dateTime: string) {
  const parsedDateTime = parseBackendDateTime(dateTime);
  return parsedDateTime
    ? parsedDateTime.format("YYYY-MM-DD")
    : "unknown";
}

/** 分组标题：今天 / 昨天 / 周几（旁边另有完整日期） */
function getTimelineDayLabel(date: string) {
  const day = dayjs(date);
  if (!day.isValid()) return "未知日期";

  const today = dayjs().startOf("day");

  if (day.isSame(today, "day")) return "今天";
  if (day.isSame(today.subtract(1, "day"), "day")) return "昨天";

  return WEEKDAY_LABELS[day.day()];
}

/** 观看时间：今天用相对时间，昨天带「昨天」，更早显示月日时分 */
function formatWatchTime(dateTime: string) {
  const watched = parseBackendDateTime(dateTime);
  if (!watched) return "";

  const now = dayjs();

  if (watched.isSame(now, "day")) {
    const minutes = now.diff(watched, "minute");
    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes} 分钟前`;
    return `${now.diff(watched, "hour")} 小时前`;
  }
  if (watched.isSame(now.subtract(1, "day"), "day")) {
    return `昨天 ${watched.format("HH:mm")}`;
  }
  return watched.format(watched.isSame(now, "year") ? "MM-DD HH:mm" : "YYYY-MM-DD HH:mm");
}

export function useVideoHistory() {
  /* ————————数据源———————— */

  const historyList = ref<VideoPlayHistory[]>([]);
  const historyItemMap = reactive(new Map<string, VideoHistoryItem[]>());

  /* ————————状态———————— */

  const pageNo = ref(1);
  const loading = ref(false);
  const finished = ref(false);
  /** 第一页请求结束过（成功或失败），之前显示骨架屏 */
  const loadedOnce = ref(false);
  const deleting = ref(false);
  let scrollTicking = false;
  let handledHistoryCount = 0;

  const historyCount = computed(() => historyList.value.length);

  /* ————————方法———————— */

  /** 视频归档删除后 LEFT JOIN video_info 无行，封面/标题均为空 */
  function isDeletedHistory(history: VideoPlayHistory) {
    return !history.videoName && !history.videoCover;
  }

  function toVideoInfo(history: VideoPlayHistory): VideoInfo {
    const hasAuthor =
      history.userId != null && !!history.nickName?.trim();

    return {
      videoId: history.videoId,
      videoCover: history.videoCover,
      videoName: history.videoName,
      briefUserInfo: hasAuthor
        ? {
            userId: String(history.userId),
            nickName: history.nickName!.trim(),
            avatar: "",
            personalIntroduction: "",
          }
        : null,
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
      deleted: isDeletedHistory(history),
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

  /*——————清空全部：先在页面上清掉，倒计时结束才调接口，期间可以撤销—————— */

  const clearPending = ref(false);
  const clearCountdown = ref(0);
  let clearTimer: number | undefined;
  let clearSnapshot: { list: VideoPlayHistory[]; pageNo: number; finished: boolean } | null = null;

  function resetList(list: VideoPlayHistory[]) {
    historyItemMap.clear();
    handledHistoryCount = 0;
    historyList.value = list;
  }

  function stopClearTimer() {
    window.clearInterval(clearTimer);
    clearTimer = undefined;
  }

  function deleteAllHistory() {
    if (deleting.value || clearPending.value || historyList.value.length === 0) return;

    clearSnapshot = {
      list: historyList.value,
      pageNo: pageNo.value,
      finished: finished.value,
    };
    resetList([]);
    clearPending.value = true;
    clearCountdown.value = CLEAR_UNDO_SECONDS;
    clearTimer = window.setInterval(() => {
      clearCountdown.value--;
      if (clearCountdown.value <= 0) {
        void commitClear();
      }
    }, 1000);
  }

  function restoreSnapshot() {
    if (!clearSnapshot) return;

    pageNo.value = clearSnapshot.pageNo;
    finished.value = clearSnapshot.finished;
    resetList(clearSnapshot.list);
    clearSnapshot = null;
  }

  function undoClear() {
    if (!clearPending.value) return;

    stopClearTimer();
    clearPending.value = false;
    restoreSnapshot();
  }

  async function commitClear() {
    if (!clearPending.value) return;

    stopClearTimer();
    clearPending.value = false;
    deleting.value = true;
    let cleared = false;
    try {
      const result = await VideoPlayHistoryApi.deleteAllHistory();
      cleared = result?.code === 200;
    } finally {
      deleting.value = false;
      if (cleared) {
        clearSnapshot = null;
        finished.value = true;
        message.success("全部历史记录已删除");
      } else {
        // 接口失败：把记录放回去，别让用户以为已经删了
        restoreSnapshot();
      }
    }
  }

  async function loadHistoryList() {
    if (loading.value || finished.value || clearPending.value) return;

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
      loadedOnce.value = true;
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

  // 倒计时没走完就离开页面或关标签页，直接提交清空
  function onPageHide() {
    void commitClear();
  }

  /* ————————初始化———————— */

  onMounted(() => {
    void loadHistoryList();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("pagehide", onPageHide);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("scroll", handleScroll);
    window.removeEventListener("pagehide", onPageHide);
    void commitClear();
  });

  return {
    historyItemMap,
    historyCount,
    loading,
    finished,
    loadedOnce,
    deleting,
    clearPending,
    clearCountdown,
    deleteHistoryItem,
    deleteAllHistory,
    undoClear,
    getTimelineDayLabel,
    formatWatchTime,
  };
}
