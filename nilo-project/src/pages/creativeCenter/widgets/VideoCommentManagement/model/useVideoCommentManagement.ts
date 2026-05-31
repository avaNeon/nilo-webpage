import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { CommentManagementApi } from "../api/CommentManagementApi";
import type { CommentManagement } from "./CommentManagement";

export function useVideoCommentManagement() {
  const route = useRoute();

  /* 路由参数 */
  const videoId = computed(() => {
    const id = route.params.videoId;
    return id ? String(id) : undefined;
  });

  /** 当有 videoId 时不显示搜索栏 */
  const hasVideoId = computed(() => !!videoId.value);

  /* 状态 */
  const searchKeyword = ref("");
  const commentCount = ref(0);
  const commentList = ref<CommentManagement[]>([]);
  const currentPage = ref(1);
  const pageSize = ref(10);

  /* 方法 */

  async function loadCommentCount() {
    const result = await CommentManagementApi.getCommentCount(
      videoId.value,
      hasVideoId.value
        ? undefined
        : searchKeyword.value === ""
          ? undefined
          : searchKeyword.value,
    );
    if (result !== null) {
      commentCount.value = result;
    }
  }

  async function loadCommentList() {
    const result = await CommentManagementApi.getCommentList(
      videoId.value,
      currentPage.value,
      pageSize.value,
      hasVideoId.value
        ? undefined
        : searchKeyword.value === ""
          ? undefined
          : searchKeyword.value,
    );
    commentList.value = result ?? [];
  }

  function handlePageNoChange(pageNo: number) {
    currentPage.value = pageNo;
    loadCommentList();
  }

  function handlePageSizeChange(size: number) {
    pageSize.value = size;
    currentPage.value = 1;
    loadCommentList();
  }

  function handleCommentDeleted(commentId: string) {
    const index = commentList.value.findIndex(c => c.commentId === commentId);
    if (index !== -1) {
      commentList.value.splice(index, 1);
      commentCount.value = Math.max(0, commentCount.value - 1);
    }
    // 当前页删空且不是第一页，回到上一页
    if (commentList.value.length === 0 && currentPage.value > 1) {
      currentPage.value--;
      loadCommentList();
    }
  }

  /* 生命周期 */

  let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  watch(searchKeyword, () => {
    if (hasVideoId.value) return;
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      currentPage.value = 1;
      loadCommentCount();
      loadCommentList();
    }, 1000);
  });

  onMounted(() => {
    loadCommentCount();
    loadCommentList();
  });

  return {
    // 路由相关
    videoId,
    hasVideoId,
    // 状态
    searchKeyword,
    commentCount,
    commentList,
    currentPage,
    pageSize,
    // 方法
    handlePageNoChange,
    handlePageSizeChange,
    handleCommentDeleted,
  };
}
