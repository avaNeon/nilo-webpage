import { computed, onMounted, ref, watch } from "vue";
import { ElMessageBox } from "element-plus";
import { CategoryApi } from "@/pages/index/widgets/content/category/api/CategoryApi";
import type { CategoryInfo } from "@/pages/index/widgets/content/category/model/CategoryInfo";
import { VideoApi } from "@/pages/index/widgets/content/upload/api/VideoApi";
import type { VideoInfoUploadQuery } from "@/pages/index/widgets/content/upload/model/VideoInfoUploadQuery";
import type { VideoInfoUpload } from "@/pages/index/widgets/content/upload/model/VideoInfoUpload";
import type { VideoInfoFileUpload } from "@/pages/index/widgets/content/upload/model/VideoInfoFileUpload";
import message from "@/shared/lib/message";

export function useUploadManagement() {
  /* —————— 分类 —————— */

  /** 分类树 */
  const categoryTree = ref<CategoryInfo[]>([]);

  /** 拉取全部分类（含子分类） */
  async function loadCategories() {
    const result = await CategoryApi.getAllCategoriesWithChildren();
    if (result) {
      categoryTree.value = result;
    }
  }

  /**
   * 扁平化的两级级联选项
   *
   * 每个一级分类作为一个父节点，其 children（如果有的话）作为子节点
   * 用于 el-cascader 的 :options
   */
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
  /*
   * 三个筛选项：模糊查询视频名称、分类、推荐状态
   */

  /** 视频名称模糊搜索关键字 */
  const searchKeyword = ref("");

  /** 当前选中的分类 ID */
  const selectedCategory = ref<number | null>(null);

  /** el-cascader 绑定的路径值（供模板 v-model 双向绑定） */
  const cascaderValue = ref<(number | string)[]>([]);

  /**
   * 分类级联选择变更回调
   */
  function onCategoryChange(values: (number | string)[] | undefined) {
    const newCategoryId =
      !values || values.length === 0 ? null : Number(values[values.length - 1]);

    cascaderValue.value = values ?? [];
    selectedCategory.value = newCategoryId;
  }

  /**
   * 推荐状态筛选值
   * - `undefined` → 不筛选（全部）
   * - `1`        → 仅推荐
   * - `0`        → 仅非推荐
   */
  const selectedRecommend = ref<number | undefined>(undefined);

  /** 推荐状态下拉选项 */
  const recommendOptions = [
    { value: undefined as number | undefined, label: "不选" },
    { value: 1, label: "推荐" },
    { value: 0, label: "非推荐" },
  ];

  /* —————— 排序 —————— */

  /**
   * 最后更新时间排序
   * - undefined → 不排序
   * - true     → 升序
   * - false    → 降序
   */
  const sortLastUpdate = ref<boolean | undefined>(undefined);

  /**
   * 状态排序
   * - undefined → 不排序
   * - true     → 升序
   * - false    → 降序
   */
  const sortStatus = ref<boolean | undefined>(undefined);

  /**
   * 处理 el-table 的 sort-change 事件
   * @param sortInfo el-table 抛出的排序信息 { prop, order }
   */
  function handleSortChange(sortInfo: { prop: string; order: string | null }) {
    const { prop, order } = sortInfo;

    // 将 el-table 的 order 映射为 API 的 boolean | undefined
    const apiValue: boolean | undefined =
      order === "ascending" ? true : order === "descending" ? false : undefined;

    // 清空所有排序状态
    sortLastUpdate.value = undefined;
    sortStatus.value = undefined;

    // 设置对应列的排序
    if (prop === "lastUpdateTime") {
      sortLastUpdate.value = apiValue;
    } else if (prop === "status") {
      sortStatus.value = apiValue;
    }

    currentPage.value = 1;
    loadVideoList();
  }

  /* —————— 视频列表 ——————*/

  /** 当前页视频数据 */
  const videoList = ref<VideoInfoUpload[]>([]);

  /** 当前页码（从 1 开始） */
  const currentPage = ref(1);

  /** 每页条数 */
  const pageSize = ref(10);

  /** 符合条件的视频总数 */
  const totalCount = ref(0);

  /** 表格加载状态 */
  const loading = ref(false);

  /**
   * 根据当前筛选条件构建查询参数
   * 所有可选字段在值为空时返回 undefined，避免发送冗余参数
   */
  function buildQuery(): VideoInfoUploadQuery {
    return {
      pageNo: currentPage.value,
      pageSize: pageSize.value,
      videoNameFuzzy: searchKeyword.value || undefined,
      categoryId: selectedCategory.value ?? undefined,
      recommendType: selectedRecommend.value,
    };
  }

  /**
   * 加载视频列表 & 总数
   * 同时调用 list 和 count 接口，用 Promise.all 并行请求。
   */
  async function loadVideoList() {
    loading.value = true;
    try {
      const query = buildQuery();
      const [listResult, countResult] = await Promise.all([
        VideoApi.loadVideoList(query, sortLastUpdate.value, sortStatus.value),
        // count 查询不需要分页参数，避免后端误用
        VideoApi.loadVideoCount({ ...query, pageNo: 1, pageSize: 1 }),
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

  /** 清空所有筛选条件并重新加载 */
  function resetFilters() {
    searchKeyword.value = "";
    cascaderValue.value = [];
    selectedCategory.value = null;
    selectedRecommend.value = undefined;
    currentPage.value = 1;
    loadVideoList();
  }

  /** 点击“查询”按钮：回到第一页并重新加载 */
  function handleSearch() {
    currentPage.value = 1;
    loadVideoList();
  }

  /** 每页条数变更：回到第一页并重新加载 */
  function handleSizeChange(size: number) {
    pageSize.value = size;
    currentPage.value = 1;
    loadVideoList();
  }

  /** 翻页 */
  function handlePageChange(page: number) {
    currentPage.value = page;
    loadVideoList();
  }

  /* —————— 操作 —————— */

  /**
   * 审核视频
   *
   * - 通过：弹窗确认后直接调用 API
   * - 驳回：弹出输入框让管理员填写拒绝理由
   *
   * @param video  当前行数据
   * @param passed true=通过，false=驳回
   */
  async function handleReview(video: VideoInfoUpload, passed: boolean) {
    // 通过
    if (passed) {
      // 确认界面
      try {
        await ElMessageBox.confirm(
          `确定要通过视频「${video.videoName}」吗？`,
          "通过确认",
          {
            type: "warning",
            confirmButtonText: "通过",
            cancelButtonText: "取消",
          },
        );
      } catch {
        return;
      }

      await VideoApi.reviewVideo(video.videoId, true);

      message.success("已通过");
    }
    // 驳回
    else {
      // 弹出窗口输入驳回原因
      const { value: refuseReason } = await ElMessageBox.prompt(
        `请输入驳回视频「${video.videoName}」的理由：`,
        "驳回确认",
        {
          type: "warning",
          confirmButtonText: "确认驳回",
          cancelButtonText: "取消",
          inputType: "textarea",
          inputPlaceholder: "请填写驳回理由，方便用户修改后重新提交",
          inputValidator: (value: string) => {
            if (!value || !value.trim()) {
              return "驳回理由不能为空";
            }
            return true;
          },
        },
      ).catch(() => {
        // 用户取消 → refuseReason 为 undefined
        return { value: undefined as string | undefined };
      });

      if (refuseReason === undefined) return; // 用户取消

      await VideoApi.reviewVideo(video.videoId, false, refuseReason.trim());

      message.success("已驳回");
    }
    loadVideoList();
  }

  /**
   * 切换视频推荐状态
   * 接口成功后直接修改本地数据，避免额外请求
   */
  async function handleToggleRecommend(video: VideoInfoUpload) {
    const result = await VideoApi.toggleVideoRecommend(video.videoId);
    if (result) {
      video.recommendType = video.recommendType === 1 ? 0 : 1;
      message.success("已切换推荐状态");
    }
  }

  /**
   * 删除用户视频
   * 弹出输入框让管理员填写删除原因，与驳回流程保持一致。
   */
  async function handleDelete(video: VideoInfoUpload) {
    const { value: detail } = await ElMessageBox.prompt(
      `请输入删除视频「${video.videoName}」的原因（注意：如果视频没有发布上线，删除后将无法恢复）：`,
      "删除确认",
      {
        type: "warning",
        confirmButtonText: "确认删除",
        cancelButtonText: "取消",
        inputType: "textarea",
        inputPlaceholder: "请填写删除原因",
        inputValidator: (value: string) => {
          if (!value || !value.trim()) {
            return "删除原因不能为空";
          }
          return true;
        },
      },
    ).catch(() => {
      return { value: undefined as string | undefined };
    });

    if (detail === undefined) return; // 用户取消

    await VideoApi.deleteVideo(video.userId, video.videoId, detail.trim());
    message.success("已删除");
    loadVideoList();
  }

  /* —————— 视频预览弹窗 —————— */

  const previewVisible = ref(false);
  const previewVideoInfo = ref<VideoInfoUpload | null>(null);
  const previewFileList = ref<VideoInfoFileUpload[]>([]);

  /** 点击行打开预览弹窗，同时加载分P列表 */
  async function openPreview(video: VideoInfoUpload) {
    previewVideoInfo.value = video;

    const files = await VideoApi.loadVideoFileList(video.videoId);

    previewFileList.value = files ?? [];

    previewVisible.value = true;
  }

  /*
   * - 推荐状态变更时自动重新查询
   * - 组件挂载时初始化分类数据和视频列表
   */

  // 推荐筛选值变化 → 回到第一页并重新加载
  watch(selectedRecommend, () => {
    currentPage.value = 1;
    loadVideoList();
  });

  onMounted(async () => {
    await loadCategories();
    await loadVideoList();
  });

  return {
    /* 分类 */
    categoryTree,
    flatCategoryOptions,

    /* 筛选 */
    searchKeyword,
    selectedCategory,
    cascaderValue,
    onCategoryChange,
    selectedRecommend,
    recommendOptions,

    /* 排序 */
    handleSortChange,

    /* 列表 & 分页 */
    videoList,
    currentPage,
    pageSize,
    totalCount,
    loading,

    /* 方法 —— 查询 */
    handleSearch,
    handleSizeChange,
    handlePageChange,
    resetFilters,
    loadVideoList,

    /* 方法 —— 操作 */
    handleReview,
    handleToggleRecommend,
    handleDelete,

    /* 预览弹窗 */
    previewVisible,
    previewVideoInfo,
    previewFileList,
    openPreview,
  };
}
