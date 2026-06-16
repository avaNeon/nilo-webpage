import { computed, onMounted, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { CategoryApi } from "@/pages/index/widgets/content/category/api/CategoryApi";
import type { CategoryInfo } from "@/pages/index/widgets/content/category/model/CategoryInfo";
import message from "@/shared/lib/message";

export interface ColumnProperty {
  label: string;
  prop: string;
  width?: number;
  minWidth?: number;
  align?: "left" | "center" | "right";
  fixed?: "left" | "right";
}

/** 一级分类表格列定义 */
export const primaryCategoryColumns: ColumnProperty[] = [
  { label: "图标", prop: "icon", width: 90, align: "center" },
  { label: "背景", prop: "background", width: 190, align: "center" },
  { label: "主题色", prop: "color", width: 120, align: "center" },
  { label: "分类编号", prop: "categoryNumber", minWidth: 150 },
  { label: "分类名称", prop: "categoryName", minWidth: 100 },
  {
    label: "操作",
    prop: "action",
    width: 160,
    align: "center",
    fixed: "right",
  },
];

/** 二级分类表格列定义 */
export const secondaryCategoryColumns: ColumnProperty[] = [
  { label: "分类编号", prop: "categoryNumber", minWidth: 120 },
  { label: "分类名称", prop: "categoryName", minWidth: 120 },
  {
    label: "操作",
    prop: "action",
    width: 160,
    align: "center",
    fixed: "right",
  },
];

export function useCategoryManagement() {
  /* ————————————分类—————————— */

  /** 分类数据源 */
  const categoryTree = ref<CategoryInfo[]>([]);

  /** 加载所有分类及其子分类 */
  async function loadAllCategories() {
    const result = await CategoryApi.getAllCategoriesWithChildren();
    if (result) {
      categoryTree.value = result;
    }
  }

  onMounted(async () => {
    // 初始化分类数据
    await loadAllCategories();
  });

  /** 当前选中的一级分类 */
  const currentCategory = ref<CategoryInfo | null>(null);

  /** 选中一级分类行 */
  function selectCategory(row: CategoryInfo | null) {
    currentCategory.value = row;
  }

  /** 当前选中分类的二级分类列表（无children则为空数组） */
  const currentChildren = computed<CategoryInfo[]>(() => {
    return currentCategory.value?.children ?? [];
  });

  /* ————————————分类编辑器—————————— */

  /** 编辑器弹窗是否可见 */
  const editorVisible = ref(false);

  /** 编辑器父级分类 ID（0=一级分类，>0=二级分类） */
  const editorPCategoryId = ref(0);

  /** 编辑器待编辑的分类 ID（0=新增，>0=修改） */
  const editorCategoryId = ref(0);

  /**
   * 打开分类编辑器
   * @param categoryId  若传入 >0 则为修改模式，否则为新增模式
   * @param pCategoryId 父级分类 ID（仅新增时需要指定，修改时自动推断）
   */
  function openCategoryEditor(categoryId: number = 0, pCategoryId: number = 0) {
    editorCategoryId.value = categoryId;
    editorPCategoryId.value = pCategoryId;
    editorVisible.value = true;
  }

  /** 打开二级分类编辑器（新增，自动绑定当前选中一级分类） */
  function openSubCategoryEditor() {
    openCategoryEditor(0, currentCategory.value?.categoryId ?? 0);
  }

  /** 删除分类 */
  async function deleteCategory(row: CategoryInfo) {
    try {
      // 弹窗确认
      await ElMessageBox.confirm(
        `确定要删除分类「${row.categoryName}」吗？`,
        "删除确认",
        {
          type: "warning",
          confirmButtonText: "删除",
          cancelButtonText: "取消",
        },
      );
    } catch {
      // 用户取消操作
      return;
    }

    // 删除
    await CategoryApi.deleteCategory(row.categoryId ?? 0);

    message.success("删除成功");

    // 重新加载列表
    await loadAllCategories();
  }

  /* ————————————排序—————————— */

  /** 当前是否为排序模式 */
  const sortMode = ref(false);

  /** 排序模式下的暂存列表 */
  const sortEditedList = ref<CategoryInfo[]>([]);

  /** 排序时使用的父分类 ID */
  const sortParentId = ref(0);

  /** 进入排序模式 */
  function enterSortMode(list: CategoryInfo[], parentId: number) {
    sortEditedList.value = [...list];
    sortParentId.value = parentId;
    sortMode.value = true;
  }

  /** 取消排序 */
  function cancelSort() {
    sortMode.value = false;

    // 清空中间状态
    sortEditedList.value = [];
    sortParentId.value = 0;
  }

  /** 确认排序 */
  async function confirmSort() {
    // 将列表转化为ID列表
    const ids = sortEditedList.value
      .map(c => c.categoryId ?? 0)
      .filter(id => id > 0);

    await CategoryApi.sortCategory(ids, sortParentId.value);

    message.success("排序成功");

    sortMode.value = false;

    // 清空中间状态
    sortEditedList.value = [];
    sortParentId.value = 0;

    // 重新加载分类
    await loadAllCategories();
  }

  return {
    categoryTree,
    loadAllCategories,
    currentCategory,
    selectCategory,
    currentChildren,
    editorVisible,
    editorPCategoryId,
    editorCategoryId,
    openCategoryEditor,
    openSubCategoryEditor,
    deleteCategory,
    sortMode,
    sortEditedList,
    sortParentId,
    enterSortMode,
    cancelSort,
    confirmSort,
  };
}
