import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { DanmakuManagementApi } from "../api/DanmakuManagementApi";
import type { DanmakuManagement } from "./DanmakuManagement";

export function useDanmakuManagement() {
  const route = useRoute();

  /* 路由参数 */
  const videoId = computed(() => {
    const id = route.params.videoId;
    return id ? String(id) : undefined;
  });

  const fileIndex = computed(() => {
    const idx = route.params.fileIndex;
    if (idx === undefined || idx === "") return undefined;
    const num = Number(idx);
    return Number.isNaN(num) ? undefined : num;
  });

  /** 当有 videoId 时不显示搜索栏 */
  const hasVideoId = computed(() => !!videoId.value);

  /* 状态 */
  const searchKeyword = ref("");
  const danmakuCount = ref(0);
  const danmakuList = ref<DanmakuManagement[]>([]);
  const currentPage = ref(1);
  const pageSize = ref(10);

  /* 方法 */

  async function loadDanmakuCount() {
    const result = await DanmakuManagementApi.getDanmakuCount(
      videoId.value,
      fileIndex.value,
      hasVideoId.value
        ? undefined
        : searchKeyword.value === ""
          ? undefined
          : searchKeyword.value,
    );
    if (result !== null) {
      danmakuCount.value = result;
    }
  }

  async function loadDanmakuList() {
    const result = await DanmakuManagementApi.getDanmakuList(
      videoId.value,
      fileIndex.value,
      currentPage.value,
      pageSize.value,
      hasVideoId.value
        ? undefined
        : searchKeyword.value === ""
          ? undefined
          : searchKeyword.value,
    );
    danmakuList.value = result ?? [];
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

  async function handleDanmakuDeleted(danmakuId: string): Promise<boolean> {
    const ok = await DanmakuManagementApi.deleteDanmaku(danmakuId);
    if (ok) {
      const index = danmakuList.value.findIndex(d => d.danmakuId === danmakuId);
      if (index !== -1) {
        danmakuList.value.splice(index, 1);
        danmakuCount.value = Math.max(0, danmakuCount.value - 1);
      }
      // 当前页删空且不是第一页，回到上一页
      if (danmakuList.value.length === 0 && currentPage.value > 1) {
        currentPage.value--;
        loadDanmakuList();
      }
    }
    return ok;
  }

  /* 生命周期 */

  let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  watch(searchKeyword, () => {
    if (hasVideoId.value) return;
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      currentPage.value = 1;
      loadDanmakuCount();
      loadDanmakuList();
    }, 1000);
  });

  onMounted(() => {
    loadDanmakuCount();
    loadDanmakuList();
  });

  return {
    // 路由相关
    videoId,
    fileIndex,
    hasVideoId,
    // 状态
    searchKeyword,
    danmakuCount,
    danmakuList,
    currentPage,
    pageSize,
    // 方法
    handlePageNoChange,
    handlePageSizeChange,
    handleDanmakuDeleted,
  };
}
