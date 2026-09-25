import request from "@/shared/lib/request";
import { Api } from "@/shared/config/Api";
import type { StatisticsInfo } from "@/pages/creativeCenter/widgets/creativeCenterHome/model/StatisticsInfo";

/** 后端 Long 可能以字符串传过来，统一转成数字；转不了返回 null */
function toCount(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const count = Number(value);
  return Number.isFinite(count) ? count : null;
}

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

  /**
   * 累计播放数、获赞数（取自用户主页信息）
   * 这几个累计数只是补充展示，失败时不弹错误提示
   *
   * @param userId 当前登录用户ID
   */
  async loadPlayAndLikeTotal(
    userId: string,
  ): Promise<{ playCount: number | null; likeCount: number | null } | null> {
    const result = await request({
      method: "get",
      url: Api.getUserDetail + userId,
      showError: false,
    });
    if (!result || !result.data) return null;
    return {
      playCount: toCount(result.data.playCount),
      likeCount: toCount(result.data.likeCount),
    };
  },

  /**
   * 累计评论数（创作中心评论管理的总数，不带筛选条件）
   */
  async loadCommentTotal(): Promise<number | null> {
    const result = await request({
      method: "get",
      url: Api.ccCommentCount,
      showError: false,
    });
    if (!result) return null;
    return toCount(result.data);
  },

  /**
   * 累计弹幕数（创作中心弹幕管理的总数，不带筛选条件）
   */
  async loadDanmakuTotal(): Promise<number | null> {
    const result = await request({
      method: "get",
      url: Api.ccDanmakuCount,
      showError: false,
    });
    if (!result) return null;
    return toCount(result.data);
  },
} as const;
