import { ref } from "vue";
import type { WallpaperItem } from "./WallpaperItem";

export function useUserHomeBgImg() {
  /* ——————初始化：Vite 编译时加载所有背景图，静态数据源不变化—————— */

  const backgroundList: WallpaperItem[] = [];

  const bgModules = import.meta.glob(
    "@/assets/userHome-background/thumbnails/*.jpg",
    {
      eager: true,
    },
  );

  for (const [filePath, mod] of Object.entries(bgModules)) {
    const match = filePath.match(/background-(\d+)\.jpg$/);
    if (match) {
      backgroundList.push({
        index: Number(match[1]),
        url: (mod as { default: string }).default,
      });
    }
  }

  backgroundList.sort((a, b) => a.index - b.index);

  /* ————————状态———————— */

  /** 当前 drawer 中选中的壁纸序号 */
  const selectedIndex = ref<number>(1);

  /* ————————方法———————— */

  /** 选中壁纸 */
  function selectWallpaper(index: number) {
    selectedIndex.value = index;
  }

  return {
    backgroundList,
    selectedIndex,
    selectWallpaper,
  };
}
