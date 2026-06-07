import { UserHomeCollectionApi } from "../api/UserHomeCollectionApi";
import type { CollectedVideoInfo } from "../model/CollectedVideoInfo";
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";

export function useUserHomeCollection() {
  const route = useRoute();

  /* ——————状态—————— */

  const pageNo = ref(0);
  const videoList = ref<CollectedVideoInfo[]>([]);
  const count = ref(0);
  const pageSize = ref(0);
  const pageTotal = computed(() => {
    if (pageSize.value === 0) {
      return 1;
    }
    return Math.ceil(count.value / pageSize.value);
  });

  /* ——————方法—————— */

  /** 加载收藏视频 */
  async function loadCollection(newPageNo: number) {
    if (pageTotal.value < newPageNo) {
      return;
    }

    pageNo.value = newPageNo;

    const result = await UserHomeCollectionApi.loadCollection(
      route.params.userId as string,
      pageNo.value,
    );

    if (result === null) {
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

  /* ——————初始化—————— */

  onMounted(() => {
    loadCollection(1);
  });

  return {
    count,
    pageNo,
    pageSize,
    pageTotal,
    videoList,
    loadCollection,
  };
}
