import useCategoryStore from "@/shared/store/CategoryStore";
import { CategoryUtil } from "@/shared/utils/CategoryUtil";
import { computed, ref } from "vue";

// ==================== category option types ====================
export interface CategoryOption {
  value: string;
  label: string;
}

export interface ParentCategoryOption extends CategoryOption {
  children: CategoryOption[];
}

/** Let's deal with category tag */
export function useCategoryTag() {
  const categoryStore = useCategoryStore();

  // ==================== category select ====================

  /** father category options */
  const categoryOptions = computed<ParentCategoryOption[]>(() =>
    categoryStore.categoryList.map(c => ({
      value: c.categoryNumber,
      label: c.categoryName,
      children: (c.children ?? []).map(child => ({
        value: child.categoryNumber,
        label: child.categoryName,
      })),
    })),
  );

  /** child category options */
  const childCategoryOptions = computed<CategoryOption[]>(() => {
    const children = getSelectedParentNumber()?.children ?? [];
    return [{ value: "", label: "不指定二级分类" }, ...children];
  });

  /** current target parent category number (local state) */
  const selectedParentNumber = ref("");

  /** current target child category number (local state) */
  const selectedChildNumber = ref("");

  function getSelectedParentNumber() {
    return categoryOptions.value.find(
      c => c.value === selectedParentNumber.value,
    );
  }

  /** on parent category changed, reset child */
  function onParentCategoryChange() {
    selectedChildNumber.value = "";
  }

  /** on child category changed */
  function onChildCategoryChange() {
    // category number sync is handled by watch in useVideoUpload
  }

  function syncCategorySelectionByCategoryNumber(categoryNumber: string) {
    const selection = CategoryUtil.resolveSelectionByValue(
      categoryNumber,
      categoryOptions.value,
    );
    if (!selection) return;
    selectedParentNumber.value = selection.parentValue;
    selectedChildNumber.value = selection.childValue;
    // category number sync is handled by watch in useVideoUpload
  }

  return {
    categoryOptions,
    selectedParentNumber,
    selectedChildNumber,
    childCategoryOptions,
    onParentCategoryChange,
    onChildCategoryChange,
    syncCategorySelectionByCategoryNumber,
  };
}
