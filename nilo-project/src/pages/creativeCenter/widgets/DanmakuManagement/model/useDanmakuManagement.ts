import { ref, computed, onMounted, onBeforeUnmount, reactive, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  readVideoFilterState,
  type VideoFilterInfo,
} from "@/pages/creativeCenter/shared/lib/videoFilter";
import { DanmakuManagementApi } from "../api/DanmakuManagementApi";
import type { DanmakuManagement } from "./DanmakuManagement";

const ROUTE_NAME = "danmakuManagement";

/** 每页固定 10 条 */
export const DANMAKU_PAGE_SIZE = 10;

/** 输入搜索词后自动搜索的延迟 */
const SEARCH_DEBOUNCE_MS = 1000;

export function useDanmakuManagement() {
  const route = useRoute();
  const router = useRouter();

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

  /** 当有 videoId 时不显示搜索栏，换成「仅看此视频」 */
  const hasVideoId = computed(() => !!videoId.value);

  /* 状态 */
  const searchKeyword = ref("");
  /** 当前列表和数量实际使用的搜索词 */
  const appliedKeyword = ref("");
  /** 拿到数量之前为 null（标题先不显示数量） */
  const danmakuCount = ref<number | null>(null);
  const danmakuList = ref<DanmakuManagement[]>([]);
  /** 列表至少返回过一次，之前不显示空状态 */
  const listLoaded = ref(false);
  const currentPage = ref(1);
  /** 正在删除的弹幕，按钮先禁用 */
  const deletingIds = reactive(new Set<string>());
  /** 稿件管理跳过来时带的视频标题、封面 */
  const filterState = ref<VideoFilterInfo | null>(null);

  /** 「仅看此视频」胶囊：优先用跳转带过来的信息，没有就用第一条弹幕的视频名（弹幕没有封面） */
  const filterVideo = computed(() => {
    const first = danmakuList.value[0];
    return {
      title: filterState.value?.videoName ?? first?.videoName ?? null,
      cover: filterState.value?.videoCover ?? null,
    };
  });

  /* 方法 */

  // 请求序号：只采用最后一次请求的结果，避免先发后到覆盖新数据
  let countSeq = 0;
  let listSeq = 0;

  async function loadDanmakuCount() {
    const seq = ++countSeq;
    const result = await DanmakuManagementApi.getDanmakuCount(
      videoId.value,
      fileIndex.value,
      appliedKeyword.value || undefined,
    );
    if (seq !== countSeq) return;
    if (result !== null) {
      danmakuCount.value = result;
    }
  }

  async function loadDanmakuList() {
    const seq = ++listSeq;
    const result = await DanmakuManagementApi.getDanmakuList(
      videoId.value,
      fileIndex.value,
      currentPage.value,
      DANMAKU_PAGE_SIZE,
      appliedKeyword.value || undefined,
    );
    if (seq !== listSeq) return;
    danmakuList.value = result ?? [];
    listLoaded.value = true;
  }

  let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  function cancelSearchDebounce() {
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = null;
    }
  }

  /** 按当前筛选和搜索词从第 1 页重新加载数量和列表 */
  function reload() {
    cancelSearchDebounce();
    appliedKeyword.value = hasVideoId.value ? "" : searchKeyword.value.trim();
    currentPage.value = 1;
    loadDanmakuCount();
    loadDanmakuList();
  }

  /** 输入搜索词：停顿一会儿再搜索 */
  function handleKeywordInput(keyword: string) {
    searchKeyword.value = keyword;
    cancelSearchDebounce();
    searchDebounceTimer = setTimeout(reload, SEARCH_DEBOUNCE_MS);
  }

  /** 回车或点放大镜：立即搜索 */
  function handleSearch() {
    reload();
  }

  function handlePageNoChange(pageNo: number) {
    currentPage.value = pageNo;
    loadDanmakuList();
  }

  /** 点 ×：回到全部视频 */
  function clearVideoFilter() {
    router.push({ name: ROUTE_NAME });
  }

  /** 删除弹幕，成功返回 true */
  async function deleteDanmaku(danmakuId: string): Promise<boolean> {
    if (deletingIds.has(danmakuId)) return false;
    deletingIds.add(danmakuId);
    let ok = false;
    try {
      ok = await DanmakuManagementApi.deleteDanmaku(danmakuId);
    } finally {
      deletingIds.delete(danmakuId);
    }
    if (!ok) return false;

    // 这页只剩这一条时先不移除，等重新加载的结果替换，免得空状态闪一下
    const index = danmakuList.value.findIndex(d => d.danmakuId === danmakuId);
    if (index !== -1 && danmakuList.value.length > 1) {
      danmakuList.value.splice(index, 1);
    }
    if (danmakuCount.value !== null) {
      danmakuCount.value = Math.max(0, danmakuCount.value - 1);
    }
    // 重新拉当前页，后面的弹幕补上来；这页删空了就回到最后一页
    const lastPage = Math.max(1, Math.ceil((danmakuCount.value ?? 0) / DANMAKU_PAGE_SIZE));
    currentPage.value = Math.min(currentPage.value, lastPage);
    loadDanmakuList();
    return true;
  }

  /* 生命周期 */

  // 路由组件会复用：/cc/danmaku/123 → /cc/danmaku（点 × 或侧栏）只是参数变了，要自己重新加载
  watch([videoId, fileIndex], () => {
    if (route.name !== ROUTE_NAME) return;
    searchKeyword.value = "";
    danmakuList.value = [];
    danmakuCount.value = null;
    listLoaded.value = false;
    filterState.value = hasVideoId.value ? readVideoFilterState() : null;
    reload();
  });

  onMounted(() => {
    filterState.value = hasVideoId.value ? readVideoFilterState() : null;
    reload();
  });

  onBeforeUnmount(cancelSearchDebounce);

  return {
    // 路由相关
    videoId,
    fileIndex,
    hasVideoId,
    // 状态
    searchKeyword,
    appliedKeyword,
    danmakuCount,
    danmakuList,
    listLoaded,
    currentPage,
    deletingIds,
    filterVideo,
    // 方法
    handleKeywordInput,
    handleSearch,
    handlePageNoChange,
    clearVideoFilter,
    deleteDanmaku,
  };
}
