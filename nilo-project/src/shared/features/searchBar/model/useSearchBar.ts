import Cookies from "js-cookie";
import { VideoSearchApi } from "@/shared/api/VideoSearchApi";
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
  watch,
} from "vue";
import { useRoute, useRouter } from "vue-router";

const SEARCH_HISTORY_COOKIE_KEY = "search_history";
const MAX_SEARCH_HISTORY_COUNT = 50;
const SEARCH_HISTORY_COOKIE_EXPIRES = 365;

interface UseSearchBarOptions {
  openInNewPage?: boolean;
}

export function useSearchBar(options: UseSearchBarOptions = {}) {
  const route = useRoute();
  const router = useRouter();
  const openInNewPage = options.openInNewPage ?? true;
  const searchBarRef = useTemplateRef<HTMLElement | null>("searchBarRef");
  const historyListRef = useTemplateRef<HTMLElement | null>("historyListRef");
  let historyListResizeObserver: ResizeObserver | null = null;

  /*——————数据源—————— */

  const searchKeyword = ref("");
  const searchHistoryList = ref<string[]>([]);
  const hotKeywordList = ref<string[]>([]);

  /*——————状态—————— */

  const searchPanelVisible = ref(false);
  const searchHistoryExpanded = ref(false);
  const searchHistoryExpandable = ref(false);

  /*——————方法—————— */

  function readSearchHistoryFromCookie(): string[] {
    const cookieValue = Cookies.get(SEARCH_HISTORY_COOKIE_KEY);
    // 如果cookie不存在，返回空数组
    if (!cookieValue) {
      return [];
    }

    try {
      const parsedValue = JSON.parse(cookieValue);
      if (!Array.isArray(parsedValue)) {
        return [];
      }
      return parsedValue.filter(
        (item): item is string =>
          typeof item === "string" && item.trim() !== "",
      );
    } catch {
      return [];
    }
  }

  function writeSearchHistoryToCookie(historyList: string[]) {
    Cookies.set(SEARCH_HISTORY_COOKIE_KEY, JSON.stringify(historyList), {
      expires: SEARCH_HISTORY_COOKIE_EXPIRES,
      path: "/",
    });
  }

  function saveSearchKeyword(keyword: string) {
    const normalizedKeyword = keyword.trim();
    // 校验关键字是否有内容
    if (!normalizedKeyword) {
      return;
    }

    const cookieHistoryList = readSearchHistoryFromCookie();
    const historyList = [
      normalizedKeyword,
      ...cookieHistoryList.filter(item => item !== normalizedKeyword),
    ].slice(0, MAX_SEARCH_HISTORY_COUNT);

    searchHistoryList.value = historyList;
    writeSearchHistoryToCookie(historyList);
  }

  function searchVideo(keyword = searchKeyword.value) {
    const normalizedKeyword = keyword.trim();
    // 如果关键词为空，不进行搜索
    if (!normalizedKeyword) {
      return;
    }

    saveSearchKeyword(normalizedKeyword);
    searchKeyword.value = normalizedKeyword;
    toSearchPage(normalizedKeyword);
  }

  function toSearchPage(keyword: string) {
    const routeLocation = {
      name: "video-search",
      params: {
        keyword,
      },
    };

    if (openInNewPage) {
      const { href } = router.resolve(routeLocation);
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }

    router.push(routeLocation);
  }

  /** 加载热搜关键词 */
  async function loadHotKeyword() {
    const loadedHotKeywordList = await VideoSearchApi.getHotKeyword();
    hotKeywordList.value = loadedHotKeywordList?.filter(Boolean) ?? [];
  }

  function showSearchPanel() {
    searchPanelVisible.value = true;
  }

  function hideSearchPanel() {
    searchPanelVisible.value = false;
  }

  /** 展开/收起历史记录 */
  function toggleSearchHistoryExpanded() {
    searchHistoryExpanded.value = !searchHistoryExpanded.value;
    nextTick(checkSearchHistoryOverflow);
  }

  /** 检查搜索历史是否溢出 */
  function checkSearchHistoryOverflow() {
    const historyList = historyListRef.value;
    if (!historyList) {
      searchHistoryExpandable.value = false;
      return;
    }

    if (searchHistoryExpanded.value) {
      searchHistoryExpandable.value = true;
      return;
    }

    searchHistoryExpandable.value =
      historyList.scrollHeight > historyList.clientHeight + 1;
  }

  function onDocumentClick(event: MouseEvent) {
    const target = event.target as Node;
    if (searchBarRef.value && !searchBarRef.value.contains(target)) {
      hideSearchPanel();
    }
  }

  onMounted(() => {
    searchHistoryList.value = readSearchHistoryFromCookie();
    loadHotKeyword();
    historyListResizeObserver = new ResizeObserver(() => {
      checkSearchHistoryOverflow();
    });
    document.addEventListener("click", onDocumentClick);
    if (route.params.keyword) {
      searchKeyword.value = route.params.keyword as string;
    }
  });

  onBeforeUnmount(() => {
    historyListResizeObserver?.disconnect();
    document.removeEventListener("click", onDocumentClick);
  });

  watch(searchPanelVisible, visible => {
    if (!visible) {
      return;
    }

    nextTick(() => {
      if (historyListRef.value) {
        historyListResizeObserver?.observe(historyListRef.value);
      }
      checkSearchHistoryOverflow();
    });
  });

  watch(
    // 当历史记录改变马上检查是否溢出
    searchHistoryList,
    () => {
      nextTick(checkSearchHistoryOverflow);
    },
    { deep: true },
  );

  return {
    searchPanelVisible,
    searchKeyword,
    searchHistoryList,
    searchHistoryExpanded,
    searchHistoryExpandable,
    hotKeywordList,
    searchVideo,
    showSearchPanel,
    hideSearchPanel,
    toggleSearchHistoryExpanded,
  };
}
