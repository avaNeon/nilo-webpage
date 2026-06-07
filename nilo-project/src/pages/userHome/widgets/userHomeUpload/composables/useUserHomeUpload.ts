import { UserHomeSharedApi } from "@/pages/userHome/shared/api/UserHomeSharedApi";
import type { SortType } from "@/pages/userHome/shared/model/SortType";
import type { VideoInfo } from "@/shared/model/VideoInfo";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

export function useUserHomeUpload() {
  const route = useRoute();
  const router = useRouter();

  /* ——————数据源—————— */
  const SortTypes: SortType[] = [
    { value: 1, label: "最新更新" },
    { value: 2, label: "最多播放" },
    { value: 3, label: "最多收藏" },
  ];

  /* ——————状态—————— */

  const pageNo = ref(0);
  const videoList = ref<VideoInfo[]>([]);
  const sortTypeValue = computed(() => {
    const value = route.params.sortType as string;

    // 默认类型为1（最新更新视频）
    if (value === undefined || value === null || value === "") {
      return 1;
    } else {
      return Number(value);
    }
  });

  /** 从路由 query 读取搜索关键词 */
  const searchKeyword = computed(() => {
    const kw = route.query.keyword as string | undefined;
    return kw && kw.trim() ? kw.trim().substring(0, 100) : "";
  });

  const count = ref(0);
  const pageSize = ref(0);
  const pageTotal = computed(() => {
    if (pageSize.value === 0) {
      return 1;
    }
    return Math.ceil(count.value / pageSize.value);
  });

  /* ——————方法—————— */
  async function changeSortType(newSortTypeValue: number) {
    await router.push(
      "/user/" + route.params.userId + "/upload/" + newSortTypeValue,
    );

    // 下面刷新一下分页和视频数据
    pageNo.value = 0;
    await loadVideos(1, newSortTypeValue);
  }

  /* ——————初始化—————— */

  /** 加载视频 */
  async function loadVideos(newPageNo: number, sortType = sortTypeValue.value) {
    if (pageTotal.value < newPageNo) {
      return;
    }

    pageNo.value = newPageNo;

    const result = await UserHomeSharedApi.loadVideo(
      route.params.userId as string,
      pageNo.value,
      20,
      sortType,
      searchKeyword.value || undefined,
    );

    if (result === false || result === null) {
      return;
    }
    if (result.totalCount !== null) {
      count.value = result.totalCount;
    }
    if (result.pageSize !== null) {
      pageSize.value = result.pageSize;
    }
    if (result.list !== null) {
      videoList.value = result.list;
    }
  }

  /** 监听搜索关键词变化，重新加载 */
  watch(searchKeyword, () => {
    pageNo.value = 0;
    count.value = 0;
    pageSize.value = 0;
    loadVideos(1);
  });

  onMounted(() => {
    loadVideos(1);
  });

  return {
    SortTypes,
    sortTypeValue,
    searchKeyword,
    count,
    pageNo,
    pageSize,
    pageTotal,
    videoList,
    loadVideos,
    changeSortType,
  };
}
