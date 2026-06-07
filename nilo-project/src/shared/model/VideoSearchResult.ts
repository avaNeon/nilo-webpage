import type { PageCalculator } from "./PageCalculator";
import type { VideoInfoDoc } from "./VideoInfoDoc";

/**
 * 视频搜索结果
 */
export interface VideoSearchResult {
  pageCalculator: PageCalculator;

  videoInfoDocList: VideoInfoDoc[];
}
