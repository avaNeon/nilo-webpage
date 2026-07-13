import { computed, onMounted, ref, watch } from "vue";
import { ElMessageBox } from "element-plus";
import { CategoryApi } from "@/pages/index/widgets/content/category/api/CategoryApi";
import type { CategoryInfo } from "@/pages/index/widgets/content/category/model/CategoryInfo";
import { ArchiveApi } from "@/pages/index/widgets/content/archive/api/ArchiveApi";
import type { VideoInfoArchiveQuery } from "@/pages/index/widgets/content/archive/model/VideoInfoArchiveQuery";
import type { VideoInfoArchive } from "@/pages/index/widgets/content/archive/model/VideoInfoArchive";
import type { VideoInfoFileArchive } from "@/pages/index/widgets/content/archive/model/VideoInfoFileArchive";
import { DeleterTypeEnum } from "@/pages/index/widgets/content/archive/model/enum/DeleterTypeEnum";
import message from "@/shared/lib/message";

export function useArchiveManagement() {
  /* —————— 分类 —————— */

  const categoryTree = ref<CategoryInfo[]>([]);

  async function loadCategories() {
    const result = await CategoryApi.getAllCategoriesWithChildren();
    if (result) {
      categoryTree.value = result;
    }
  }

  const flatCategoryOptions = computed<
    {
      value: number | string;
      label: string;
      children?: { value: number; label: string }[];
    }[]
  >(() => {
    return categoryTree.value.map(pc => ({
      value: pc.categoryId ?? 0,
      label: pc.categoryName,
      children: pc.children?.length
        ? pc.children.map(sc => ({
            value: sc.categoryId ?? 0,
            label: sc.categoryName,
          }))
        : undefined,
    }));
  });

  /* —————— 筛选条件 —————— */

  const searchKeyword = ref("");
  const selectedCategory = ref<number | null>(null);
  const cascaderValue = ref<(number | string)[]>([]);

  function onCategoryChange(values: (number | string)[]) {
    cascaderValue.value = values;
    selectedCategory.value =
      values.length === 0 ? null : Number(values[values.length - 1]);
  }

  const selectedDeleterType = ref<number | undefined>(undefined);

  const deleterTypeOptions = [
    { value: undefined as number | undefined, label: "不选" },
    { value: DeleterTypeEnum.User, label: "用户" },
    { value: DeleterTypeEnum.Admin, label: "管理员" },
  ];

  /* —————— 排序 —————— */

  const sortDeleteTime = ref<boolean | undefined>(undefined);

  function handleSortChange(sortInfo: { prop: string; order: string | null }) {
    const { prop, order } = sortInfo;

    sortDeleteTime.value = undefined;

    if (prop === "deleteTime") {
      sortDeleteTime.value =
        order === "ascending"
          ? true
          : order === "descending"
            ? false
            : undefined;
    }

    currentPage.value = 1;
    loadArchiveList();
  }

  /* —————— 视频列表 —————— */

  const videoList = ref<VideoInfoArchive[]>([]);
  const currentPage = ref(1);
  const pageSize = ref(10);
  const totalCount = ref(0);
  const loading = ref(false);

  function buildQuery(): VideoInfoArchiveQuery {
    return {
      pageNo: currentPage.value,
      pageSize: pageSize.value,
      videoNameFuzzy: searchKeyword.value || undefined,
      categoryId: selectedCategory.value ?? undefined,
      deleterType: selectedDeleterType.value,
    };
  }

  async function loadArchiveList() {
    loading.value = true;
    try {
      const query = buildQuery();
      const [listResult, countResult] = await Promise.all([
        ArchiveApi.loadArchiveList(query, sortDeleteTime.value),
        ArchiveApi.loadArchiveCount(query),
      ]);
      if (listResult) {
        videoList.value = listResult;
      }
      if (countResult !== null) {
        totalCount.value = countResult;
      }
    } finally {
      loading.value = false;
    }
  }

  function handleSearch() {
    currentPage.value = 1;
    loadArchiveList();
  }

  function handleSizeChange(size: number) {
    pageSize.value = size;
    currentPage.value = 1;
    loadArchiveList();
  }

  function handlePageChange(page: number) {
    currentPage.value = page;
    loadArchiveList();
  }

  /* —————— 操作 —————— */

  async function handleRecover(video: VideoInfoArchive) {
    try {
      await ElMessageBox.confirm(
        `确定要恢复视频「${video.videoName}」吗？恢复后将回到正常视频列表。`,
        "恢复确认",
        {
          type: "warning",
          confirmButtonText: "恢复",
          cancelButtonText: "取消",
        },
      );
    } catch {
      return;
    }

    await ArchiveApi.recoverVideo(video.videoId);
    message.success("已恢复");
    loadArchiveList();
  }

  async function handleDelete(video: VideoInfoArchive) {
    try {
      await ElMessageBox.confirm(
        `确定要彻底删除存档「${video.videoName}」吗？此操作不可恢复。`,
        "删除确认",
        {
          type: "warning",
          confirmButtonText: "删除",
          cancelButtonText: "取消",
        },
      );
    } catch {
      return;
    }

    await ArchiveApi.deleteVideoArchive([video.videoId]);
    message.success("已删除");
    loadArchiveList();
  }

  /* —————— 视频预览弹窗 —————— */

  const previewVisible = ref(false);
  const previewVideoInfo = ref<VideoInfoArchive | null>(null);
  const previewFileList = ref<VideoInfoFileArchive[]>([]);

  /** 点击行打开预览弹窗，同时加载分P列表 */
  async function openPreview(video: VideoInfoArchive) {
    previewVideoInfo.value = video;

    const files = await ArchiveApi.loadArchiveFileList(video.videoId);
    previewFileList.value = files ?? [];

    previewVisible.value = true;
  }

  /* —————— 副作用 —————— */

  watch(selectedDeleterType, () => {
    currentPage.value = 1;
    loadArchiveList();
  });

  onMounted(async () => {
    await loadCategories();
    await loadArchiveList();
  });

  return {
    /* 分类 */
    flatCategoryOptions,
    /* 筛选 */
    searchKeyword,
    cascaderValue,
    onCategoryChange,
    selectedDeleterType,
    deleterTypeOptions,
    /* 排序 */
    handleSortChange,
    /* 列表 & 分页 */
    videoList,
    currentPage,
    pageSize,
    totalCount,
    loading,
    /* 方法 */
    handleSearch,
    handleSizeChange,
    handlePageChange,
    handleRecover,
    handleDelete,
    /* 预览弹窗 */
    previewVisible,
    previewVideoInfo,
    previewFileList,
    openPreview,
  };
}
