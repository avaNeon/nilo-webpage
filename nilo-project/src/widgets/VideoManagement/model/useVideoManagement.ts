import { ref, computed, onMounted, watch } from "vue";
import { VideoManagementApi } from "../api/VideoManagementApi";
import type { VideoUploadInfo } from "./VideoUploadInfo";
import type { VideoInfo } from "@/shared/model/VideoInfo";

/* ─── 分类枚举 ─────────────────────────────────────────────── */
const CategoryEnum = {
  ALL: 0,
  IN_PROGRESS: 1,
  PASSED: 2,
  FAILED: 3,
} as const;

/* ─── 转换函数 ─────────────────────────────────────────────── */

/**
 * 将 VideoUploadInfo 转换为 VideoInfo
 *
 * 字段映射说明：
 *   - parentCategoryNumber → pCategoryNumber（重命名）
 *   - tags: string | null  → tags: string[] | null（按逗号分割）
 *   - userId / recommendType → 丢弃（VideoInfo 无对应字段）
 *   - briefUserInfo / userInfo → null（VideoUploadInfo 不包含用户详情）
 */
function toVideoInfo(src: VideoUploadInfo): VideoInfo {
  return {
    videoId: src.videoId,
    videoCover: src.videoCover,
    videoName: src.videoName,
    briefUserInfo: null,
    userInfo: null,
    createTime: src.createTime,
    lastUpdateTime: src.lastUpdateTime,
    pCategoryNumber: src.parentCategoryNumber,
    categoryNumber: src.categoryNumber,
    postType: src.postType,
    originInfo: src.originInfo,
    tags: src.tags ? src.tags.split(",").map(t => t.trim()) : null,
    introduction: src.introduction,
    interaction: src.interaction,
    duration: src.duration,
    playCount: src.playCount,
    likeCount: src.likeCount,
    danmakuCount: src.danmakuCount,
    commentCount: src.commentCount,
    coinCount: src.coinCount,
    collectCount: src.collectCount,
    status: src.status,
  };
}

/* ─── 工具函数 ─────────────────────────────────────────────── */

/**
 * 将前端分类映射到后端 status 参数
 *   ALL          → undefined（不传，查询全部）
 *   IN_PROGRESS  → -1（进行中）
 *   PASSED       →  3（已通过）
 *   FAILED       →  4（未通过）
 */
function getStatusParam(category: number): number | undefined {
  switch (category) {
    case CategoryEnum.IN_PROGRESS:
      return -1;
    case CategoryEnum.PASSED:
      return 3;
    case CategoryEnum.FAILED:
      return 4;
    case CategoryEnum.ALL:
    default:
      return undefined;
  }
}

/* ─── Composable ───────────────────────────────────────────── */

export function useVideoManagement() {
  /* 状态 */
  const selectedCategory = ref<number>(CategoryEnum.ALL);
  const searchKeyword = ref<string>("");

  const videoCounts = ref({
    pendingCount: 0,
    completedCount: 0,
    failedCount: 0,
  });

  /** original video list */
  const videoList = ref<VideoUploadInfo[]>([]);

  /** transformed video list */
  const videoInfoList = computed<VideoInfo[]>(() =>
    videoList.value.map(toVideoInfo),
  );

  // pagination
  const currentPage = ref(1);
  const pageSize = ref(10);

  /** 当前分类对应的视频总数 */
  const totalCount = computed(() => {
    const { pendingCount, completedCount, failedCount } = videoCounts.value;
    switch (selectedCategory.value) {
      case CategoryEnum.IN_PROGRESS:
        return pendingCount;
      case CategoryEnum.PASSED:
        return completedCount;
      case CategoryEnum.FAILED:
        return failedCount;
      case CategoryEnum.ALL:
      default:
        return pendingCount + completedCount + failedCount;
    }
  });

  /* 方法 */

  async function loadVideoCounts() {
    const result = await VideoManagementApi.getVideoStatusCount(
      searchKeyword.value === "" ? undefined : searchKeyword.value,
    );
    if (result) {
      videoCounts.value = result;
    }
  }

  async function loadVideos() {
    const status = getStatusParam(selectedCategory.value);
    const result = await VideoManagementApi.loadVideoList(
      status,
      currentPage.value,
      pageSize.value,
      searchKeyword.value === "" ? undefined : searchKeyword.value,
    );
    videoList.value = result ?? [];
  }

  function changeCategory(category: number) {
    selectedCategory.value = category;
  }

  function handleSizeChange() {
    currentPage.value = 1;
    loadVideos();
  }

  function handlePageChange() {
    scrollToAnchor();
    loadVideos();
  }

  function removeVideo(videoId: string) {
    const index = videoList.value.findIndex(v => v.videoId === videoId);
    if (index !== -1) {
      videoList.value.splice(index, 1);
    }
  }

  // 回到页面最顶端
  const scrollToAnchor = () => {
    window.scrollTo(0, 0);
  };

  /* 生命周期 */

  // 每次切换分类时：重置页码 + 重新请求数量和列表
  watch(selectedCategory, () => {
    currentPage.value = 1;
    loadVideoCounts();
    loadVideos();
  });

  let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  watch(searchKeyword, () => {
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      currentPage.value = 1;
      loadVideoCounts();
      loadVideos();
    }, 1000);
  });

  onMounted(() => {
    loadVideoCounts();
    loadVideos();
  });

  return {
    // 枚举
    CategoryEnum,
    // 状态
    selectedCategory,
    videoCounts,
    videoInfoList,
    currentPage,
    pageSize,
    totalCount,
    searchKeyword,
    // 方法
    changeCategory,
    handleSizeChange,
    handlePageChange,
    removeVideo,
  };
}
