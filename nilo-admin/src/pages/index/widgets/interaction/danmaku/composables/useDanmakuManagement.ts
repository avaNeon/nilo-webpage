import { onMounted, ref, watch } from "vue";
import { DanmakuApi } from "@/pages/index/widgets/interaction/danmaku/api/DanmakuApi";
import type { Danmaku } from "@/pages/index/widgets/interaction/danmaku/model/Danmaku";

/** 弹幕管理页数据与筛选逻辑 */
export function useDanmakuManagement() {
  const searchKeyword = ref("");
  const danmakuCount = ref(0);
  const danmakuList = ref<Danmaku[]>([]);
  const currentPage = ref(1);
  const pageSize = ref(10);
  const loading = ref(false);

  /** 视频名称模糊查询关键词，空字符串不传参 */
  function getNameFuzzy(): string | undefined {
    const keyword = searchKeyword.value.trim();
    return keyword || undefined;
  }

  async function loadDanmakuCount() {
    const result = await DanmakuApi.loadDanmakuCount(getNameFuzzy());
    if (result !== null) {
      danmakuCount.value = result;
    }
  }

  async function loadDanmakuList() {
    loading.value = true;
    try {
      const result = await DanmakuApi.loadDanmakuList(
        currentPage.value,
        pageSize.value,
        getNameFuzzy(),
      );
      danmakuList.value = result ?? [];
    } finally {
      loading.value = false;
    }
  }

  /** 同时刷新列表与总数 */
  async function loadData() {
    await Promise.all([loadDanmakuCount(), loadDanmakuList()]);
  }

  function handleSearch() {
    currentPage.value = 1;
    loadData();
  }

  function handlePageNoChange(pageNo: number) {
    currentPage.value = pageNo;
    loadDanmakuList();
  }

  function handlePageSizeChange(size: number) {
    pageSize.value = size;
    currentPage.value = 1;
    loadDanmakuList();
  }

  /** 删除成功后更新本地列表，当前页删空时回退一页 */
  function handleDanmakuDeleted(danmakuId: string) {
    const index = danmakuList.value.findIndex(d => d.danmakuId === danmakuId);
    if (index !== -1) {
      danmakuList.value.splice(index, 1);
      danmakuCount.value = Math.max(0, danmakuCount.value - 1);
    }

    if (danmakuList.value.length === 0 && currentPage.value > 1) {
      currentPage.value--;
      loadData();
    }
  }

  // 输入防抖：1s 后自动搜索
  let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  watch(searchKeyword, () => {
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      currentPage.value = 1;
      loadData();
    }, 1000);
  });

  onMounted(() => {
    loadData();
  });

  return {
    searchKeyword,
    danmakuCount,
    danmakuList,
    currentPage,
    pageSize,
    loading,
    handleSearch,
    handlePageNoChange,
    handlePageSizeChange,
    handleDanmakuDeleted,
  };
}
