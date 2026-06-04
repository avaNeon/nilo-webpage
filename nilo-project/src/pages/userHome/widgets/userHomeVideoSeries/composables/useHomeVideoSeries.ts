import { computed, onMounted, ref, watch } from "vue";
import type { VideoSeriesInfo } from "../../../shared/model/VideoSeriesInfo";
import { UserHomeVideoSeriesApi } from "../api/UserHomeVideoSeriesApi";
import { useRoute } from "vue-router";
import { useUserHomeShared } from "@/pages/userHome/shared/composables/useUserHomeShared";
import message from "@/shared/lib/message";
import type { VideoInfo } from "@/shared/model/VideoInfo";
import { UserHomeSharedApi } from "@/pages/userHome/shared/api/UserHomeSharedApi";
import { useHostUserDetailStore } from "@/shared/store/HostUserDetailStore";

export function useHomeVideoSeries() {
  const hostUserDetailStore = useHostUserDetailStore();

  /* ——————常量—————— */

  const maxSeriesNumber = 50;
  const maxVideosNumber = 100;

  /* ——————工具—————— */

  const route = useRoute();
  const { isMySelf } = useUserHomeShared();

  /* ——————状态—————— */

  const seriesList = ref<VideoSeriesInfo[]>([]);

  // 公用排序状态
  const isResorting = ref(false);
  const canDrag = computed(() => isMySelf.value && !isResorting.value);
  const dragging = ref(false);

  const hasSeries = computed(() => seriesList.value.length > 0);
  const dialogVisible = ref(false);
  const draggingTmpSeriesList = ref<VideoSeriesInfo[]>([]);

  // 查看系列视图
  const currentSerieInfo = ref<VideoSeriesInfo | null>(null);
  const viewSerieMode = computed(() => (route.params.seriesId ? true : false));
  const videoList = ref<VideoInfo[]>([]);
  const videoCount = ref(0);
  const draggingTmpVideoList = ref<VideoInfo[]>([]);

  /* ————————方法———————— */
  /** 为系列排序 */
  async function resortSeries() {
    // 只能排序自己的系列，并且不能重复排序
    if (!isMySelf.value || isResorting.value) {
      return;
    }

    // 检查合集信息
    const seriesIdList = draggingTmpSeriesList.value.map(
      series => series.seriesId,
    );
    if (seriesIdList.some(seriesId => !seriesId)) {
      seriesList.value = [...seriesList.value];
      message.warning("合集信息不完整，暂时不能排序");
      return;
    }

    // 转化为seriesId列表
    const oldSeriesIdList = seriesList.value.map(series => series.seriesId);

    // 如果没有变化，不必请求
    if (seriesIdList.join(",") === oldSeriesIdList.join(",")) {
      message.success("系列排序已保存");
      endDragging();
      return;
    }

    // 开始排序
    isResorting.value = true;
    const success = await UserHomeVideoSeriesApi.resortVideoSeries(
      seriesIdList as string[],
    );
    isResorting.value = false;

    if (!success) {
      message.error("系列排序保存失败");
    } else {
      seriesList.value = [...draggingTmpSeriesList.value];
      message.success("系列排序已保存");
    }

    endDragging();
  }

  /** 为系列视频排序 */
  async function resortSeriesVideos() {
    // 只能排序自己的系列视频，并且不能重复排序
    if (!isMySelf.value || isResorting.value) {
      return;
    }

    // 检查是否在查看系列视频页面
    const seriesId = route.params.seriesId as string | undefined;
    if (!seriesId) {
      message.warning("系列信息不完整，暂时不能排序视频");
      return;
    }

    // 检查视频信息
    const videoIdList = draggingTmpVideoList.value.map(video => video.videoId);
    if (videoIdList.some(videoId => !videoId)) {
      message.warning("视频信息不完整，暂时不能排序");
      return;
    }

    const oldVideoIdList = videoList.value.map(video => video.videoId);
    // 如果没有变化，不必请求
    if (videoIdList.join(",") === oldVideoIdList.join(",")) {
      message.success("视频排序已保存");
      endDragging();
      return;
    }

    // 开始排序
    isResorting.value = true;
    const success = await UserHomeVideoSeriesApi.resortSeriesVideo(
      seriesId,
      videoIdList as string[],
    );
    isResorting.value = false;

    if (!success) {
      message.error("视频排序保存失败");
    } else {
      videoList.value = [...draggingTmpVideoList.value];
      message.success("视频排序已保存");
    }

    endDragging();
  }

  /** 删除系列 */
  async function deleteSeries(seriesId: string | null | undefined) {
    if (!isMySelf.value || isResorting.value) {
      return;
    }

    if (!seriesId) {
      message.warning("系列信息不完整，暂时不能删除");
      return;
    }

    const success = await UserHomeVideoSeriesApi.deleteSeries(seriesId);
    if (!success) {
      message.error("系列删除失败");
      return;
    }

    seriesList.value = seriesList.value.filter(
      series => series.seriesId !== seriesId,
    );
    draggingTmpSeriesList.value = draggingTmpSeriesList.value.filter(
      series => series.seriesId !== seriesId,
    );

    message.success("系列已删除");
  }

  /** 从当前系列中移除视频 */
  async function deleteSeriesVideo(videoId: string | null | undefined) {
    if (!isMySelf.value || isResorting.value) {
      return;
    }

    const seriesId = route.params.seriesId as string | undefined;
    if (!seriesId || !videoId) {
      message.warning("视频信息不完整，暂时不能移除");
      return;
    }

    const success = await UserHomeVideoSeriesApi.deleteSeriesVideo(
      seriesId,
      videoId,
    );
    if (!success) {
      message.error("视频移除失败");
      return;
    }

    videoList.value = videoList.value.filter(
      video => video.videoId !== videoId,
    );
    draggingTmpVideoList.value = draggingTmpVideoList.value.filter(
      video => video.videoId !== videoId,
    );
    videoCount.value = Math.max(videoCount.value - 1, 0);
    message.success("视频已移除");
  }

  /** 保存系列信息 */
  async function saveSerie(
    seriesId: string | undefined,
    seriesName: string,
    seriesDescription: string,
    videoIdList: string[],
  ) {
    const result = await UserHomeVideoSeriesApi.saveVideoSeries(
      seriesId,
      seriesName,
      seriesDescription,
      videoIdList,
    );

    if (result === null || result === false) {
      return;
    }

    message.success("操作成功");

    if (!seriesId) {
      loadSeries();
    } else {
      loadSeriesInfo(seriesId);
      loadVideos(seriesId);
      getSerieVideoCount(seriesId);
    }
  }

  /** 加载视频信息 */
  async function loadVideos(videoId: string) {
    const result = await UserHomeVideoSeriesApi.loadSeriesVideo(videoId);

    if (result) {
      videoList.value = result;
    } else {
      videoList.value = [];
    }
  }

  /** 获取系列视频数量 */
  async function getSerieVideoCount(seriesId: string) {
    const result = await UserHomeVideoSeriesApi.getSeriesVideoCount(seriesId);
    if (result === null) {
      videoCount.value = 0;
    } else {
      videoCount.value = result;
    }
  }

  /** 获取系列详情 */
  async function loadSeriesInfo(seriesId: string) {
    const result = await UserHomeSharedApi.getVideoSeriesInfo(seriesId);

    if (!result) {
      currentSerieInfo.value = null;
      return;
    }

    currentSerieInfo.value = result;
  }

  /** 清空查看系列视频模式的数据 */
  function clearSerieModeData() {
    currentSerieInfo.value = null;
    videoList.value = [];
    videoCount.value = 0;
  }

  /** 填充发布者信息到视频中 */
  function fillVideoWithHostBriefUserInfo(videoList: VideoInfo[]) {
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

    for (const video of videoList) {
      video.briefUserInfo = hostBriefUserInfo;
    }
  }

  /** 开启拖拽模式 */
  function startDragging() {
    if (!route.params.seriesId) {
      draggingTmpSeriesList.value = [...seriesList.value];
      dragging.value = true;
    } else {
      draggingTmpVideoList.value = [...videoList.value];
      dragging.value = true;
    }
  }

  /** 关闭拖拽模式 */
  function endDragging() {
    draggingTmpSeriesList.value = [];
    draggingTmpVideoList.value = [];
    dragging.value = false;
  }

  /* ———————初始化—————— */

  async function loadSeries() {
    const result = await UserHomeVideoSeriesApi.loadVideoSeries(
      route.params.userId as string,
    );

    if (result === null || result.length === 0) {
      seriesList.value = [];
      return;
    }

    seriesList.value = result;
  }

  onMounted(async () => {
    const seriesId = route.params.seriesId;
    if (!seriesId) {
      loadSeries();
    } else {
      getSerieVideoCount(seriesId as string);
      loadSeriesInfo(seriesId as string);
      loadVideos(seriesId as string);
    }
  });

  // 路由跳转到系列页面时，判断所在页面
  watch(
    () => route.params.seriesId,
    newVal => {
      // 清除排序模式，防止出现意想不到的错误
      endDragging();

      // 如果系列列表
      if (!newVal) {
        clearSerieModeData();
        loadSeries();
        return;
      }
      // 如果处于查看系列状态
      else {
        clearSerieModeData();
        getSerieVideoCount(newVal as string);
        loadSeriesInfo(newVal as string);
        loadVideos(newVal as string);
      }
    },
  );

  watch([() => hostUserDetailStore.userHostDetail, videoList], () =>
    fillVideoWithHostBriefUserInfo(videoList.value),
  );

  return {
    maxSeriesNumber,
    maxVideosNumber,
    isMySelf,
    seriesList,
    hasSeries,
    canDrag,
    dialogVisible,
    viewSerieMode,
    videoList,
    videoCount,
    currentSerieInfo,
    dragging,
    draggingTmpVideoList,
    draggingTmpSeriesList,
    loadSeries,
    resortSeries,
    resortSeriesVideos,
    deleteSeries,
    deleteSeriesVideo,
    saveSerie,
    startDragging,
    endDragging,
  };
}
