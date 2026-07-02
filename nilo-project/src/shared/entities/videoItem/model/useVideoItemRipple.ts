import useCategoryStore from "@/shared/store/CategoryStore";
import type { VideoInfo } from "@/shared/model/VideoInfo";

const DEFAULT_RIPPLE_COLOR = "#3b394c";

export function useVideoItemRipple() {
  const categoryStore = useCategoryStore();

  /**
   * 根据视频的 categoryNumber 查找对应的一级分类主题色
   * 查找优先级：
   *   1. categoryNumber 本身是一级分类 → 直接用其 color
   *   2. categoryNumber 是二级分类 → 遍历 categoryList 找父分类，取父分类的 color
   *   3. 都找不到 → 使用默认色
   */
  function getRippleStyle(videoInfo: VideoInfo) {
    const catNum = videoInfo.categoryNumber;
    let color = DEFAULT_RIPPLE_COLOR;

    if (catNum != null) {
      // 1. 先尝试直接当一级分类查
      const cat = categoryStore.categoryMap[catNum];
      if (cat?.color) {
        color = cat.color;
      } else {
        // 2. 不是一级分类，遍历 categoryList 找它的父分类
        const parent = categoryStore.categoryList.find(p =>
          p.children?.some(c => c.categoryNumber === catNum),
        );
        if (parent?.color) {
          color = parent.color;
        }
      }
    }

    return {
      "--ripple-color": color + "A0",
    } as Record<string, string>;
  }

  return {
    getRippleStyle,
  };
}
