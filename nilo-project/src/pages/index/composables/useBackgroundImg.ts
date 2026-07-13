import useCategoryStore from "@/shared/store/CategoryStore";
import { imgRequestUrl } from "@/shared/utils/ImgUtil";
import { computed } from "vue";

/** 首页分类背景图 */
export function useBackgroundImg() {
  const categoryStore = useCategoryStore();

  /** 背景图公开 URL */
  const bgImgUrl = computed((): string | null => {
    const path = categoryStore.currentPCategory?.background;
    if (!path) {
      return null;
    }
    return imgRequestUrl(path) || null;
  });

  return { bgImgUrl };
}
