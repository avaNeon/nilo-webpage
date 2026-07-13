import { onMounted, ref, watch } from "vue";
import { CommentApi } from "@/pages/index/widgets/interaction/comment/api/CommentApi";
import type { Comment } from "@/pages/index/widgets/interaction/comment/model/Comment";

export function useCommentManagement() {
  const searchKeyword = ref("");
  const commentCount = ref(0);
  const commentList = ref<Comment[]>([]);
  const currentPage = ref(1);
  const pageSize = ref(10);
  const loading = ref(false);

  function getNameFuzzy(): string | undefined {
    const keyword = searchKeyword.value.trim();
    return keyword || undefined;
  }

  async function loadCommentCount() {
    const result = await CommentApi.loadCommentCount(getNameFuzzy());
    if (result !== null) {
      commentCount.value = result;
    }
  }

  async function loadCommentList() {
    loading.value = true;
    try {
      const result = await CommentApi.loadCommentList(
        currentPage.value,
        pageSize.value,
        getNameFuzzy(),
      );
      commentList.value = result ?? [];
    } finally {
      loading.value = false;
    }
  }

  async function loadData() {
    await Promise.all([loadCommentCount(), loadCommentList()]);
  }

  function handleSearch() {
    currentPage.value = 1;
    loadData();
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

  function handleCommentDeleted(commentId: string, destroyed: boolean) {
    if (destroyed) {
      const index = commentList.value.findIndex(c => c.commentId === commentId);
      if (index !== -1) {
        commentList.value.splice(index, 1);
        commentCount.value = Math.max(0, commentCount.value - 1);
      }
    } else {
      const comment = commentList.value.find(c => c.commentId === commentId);
      if (comment) {
        // 管理员软删对应 DeleteType.DELETED_BY_ADMIN
        comment.deleted = 3;
      }
    }

    if (commentList.value.length === 0 && currentPage.value > 1) {
      currentPage.value--;
      loadData();
    }
  }

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
    commentCount,
    commentList,
    currentPage,
    pageSize,
    loading,
    handleSearch,
    handlePageNoChange,
    handlePageSizeChange,
    handleCommentDeleted,
  };
}
