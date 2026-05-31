import request from "@/shared/lib/request";
import { Api } from "@/shared/config/Api";
import type { StatisticsInfo } from "@/widgets/creativeCenterHome/model/StatisticsInfo";

export const CcHomeApi = {
  /**
   * 加载近期统计数据
   */
  async loadRecentStatisticsInfo(): Promise<StatisticsInfo[] | null> {
    const result = await request({
      method: "get",
      url: Api.loadRecentStatisticsInfo,
    });
    if (!result) return null;
    return result.data as StatisticsInfo[];
  },
} as const;
