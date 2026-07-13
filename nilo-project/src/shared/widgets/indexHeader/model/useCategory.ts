import { imgRequestUrl } from "@/shared/utils/ImgUtil";
import useCategoryStore from "@/shared/store/CategoryStore";

export function useCategory() {
  const categoryStore = useCategoryStore();

  /** 分类图标公开 URL（缩略图） */
  function getIcon(iconPath: string | undefined): string {
    return imgRequestUrl(iconPath ?? null, true);
  }

  return {
    categoryStore,
    getIcon,
  };
}
