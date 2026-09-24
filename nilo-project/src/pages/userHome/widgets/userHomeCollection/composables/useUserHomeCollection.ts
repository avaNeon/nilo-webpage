import { UserHomeCollectionApi } from "../api/UserHomeCollectionApi";
import type { CollectedVideoInfo } from "../model/CollectedVideoInfo";
import { useHostUserDetailStore } from "@/shared/store/HostUserDetailStore";
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";

export function useUserHomeCollection() {
  const route = useRoute();
  const hostUserDetailStore = useHostUserDetailStore();

  /* ——————状态—————— */

  const pageNo = ref(1);
  const videoList = ref<CollectedVideoInfo[]>([]);
  const count = ref(0);
  const pageSize = ref(0);
  const loading = ref(false);
  /** 第一次加载完之前显示骨架屏，之后翻页只把旧结果调淡 */
  const loadedOnce = ref(false);
  /** 丢弃过期响应：连续翻页时只认最后一次 */
  let requestSeq = 0;

  /* ——————方法—————— */

  /** 加载收藏视频 */
  async function loadCollection(newPageNo: number) {
    const seq = ++requestSeq;
    loading.value = true;

    const result = await UserHomeCollectionApi.loadCollection(
      route.params.userId as string,
      newPageNo,
    );

    if (seq !== requestSeq) return;
    loading.value = false;

    if (result === null) {
      return;
    }

    loadedOnce.value = true;
    pageNo.value = newPageNo;
    count.value = result.totalCount ?? 0;
    pageSize.value = result.pageSize ?? 0;
    videoList.value = result.list ?? [];
    // 顺带把标签栏上的收藏数填上
    hostUserDetailStore.setCount("collection", count.value);
  }

  /* ——————初始化—————— */

  onMounted(() => {
    loadCollection(1);
  });

  return {
    count,
    pageNo,
    pageSize,
    videoList,
    loading,
    loadedOnce,
    loadCollection,
  };
}
