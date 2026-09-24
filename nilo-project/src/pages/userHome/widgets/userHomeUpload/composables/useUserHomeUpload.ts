import { UserHomeSharedApi } from "@/pages/userHome/shared/api/UserHomeSharedApi";
import type { SortType } from "@/pages/userHome/shared/model/SortType";
import type { VideoInfo } from "@/shared/model/VideoInfo";
import { useHostUserDetailStore } from "@/shared/store/HostUserDetailStore";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

/** 每页 4 行 */
const PAGE_SIZE = 20;

export function useUserHomeUpload() {
  const route = useRoute();
  const router = useRouter();
  const hostUserDetailStore = useHostUserDetailStore();

  /* ——————数据源—————— */
  const SortTypes: SortType[] = [
    { value: 1, label: "最新更新" },
    { value: 2, label: "最多播放" },
    { value: 3, label: "最多收藏" },
  ];

  /* ——————状态—————— */

  const pageNo = ref(1);
  const videoList = ref<VideoInfo[]>([]);
  const loading = ref(false);
  /** 第一次加载完之前显示骨架屏，之后换页只把旧结果调淡 */
  const loadedOnce = ref(false);
  /** 丢弃过期响应：连点排序/翻页时只认最后一次 */
  let requestSeq = 0;

  const sortTypeValue = computed(() => {
    const value = Number(route.params.sortType);
    // 默认类型为1（最新更新视频）
    return SortTypes.some(sortType => sortType.value === value) ? value : 1;
  });

  /** 从路由 query 读取搜索关键词 */
  const searchKeyword = computed(() => {
    const kw = route.query.keyword as string | undefined;
    return kw && kw.trim() ? kw.trim().substring(0, 100) : "";
  });

  const count = ref(0);
  const pageSize = ref(PAGE_SIZE);

  /* ——————方法—————— */
  async function changeSortType(newSortTypeValue: number) {
    if (newSortTypeValue === sortTypeValue.value) return;

    await router.push({
      name: "userUpload",
      params: { userId: route.params.userId, sortType: newSortTypeValue },
      query: route.query,
    });
    await loadVideos(1, newSortTypeValue);
  }

  /* ——————初始化—————— */

  /** 加载视频 */
  async function loadVideos(newPageNo: number, sortType = sortTypeValue.value) {
    const seq = ++requestSeq;
    const keyword = searchKeyword.value;
    loading.value = true;

    const result = await UserHomeSharedApi.loadVideo(
      route.params.userId as string,
      newPageNo,
      PAGE_SIZE,
      sortType,
      keyword || undefined,
    );

    if (seq !== requestSeq) return;
    loading.value = false;

    if (result === false) {
      return;
    }

    loadedOnce.value = true;
    pageNo.value = newPageNo;
    count.value = result?.totalCount ?? 0;
    pageSize.value = result?.pageSize || PAGE_SIZE;
    videoList.value = result?.list ?? [];

    // 不带关键词时就是总投稿数，顺带填到标签栏
    if (!keyword) {
      hostUserDetailStore.setCount("upload", count.value);
    }
  }

  /** 监听搜索关键词变化，重新加载 */
  watch(searchKeyword, () => {
    loadedOnce.value = false;
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
    videoList,
    loading,
    loadedOnce,
    loadVideos,
    changeSortType,
  };
}
