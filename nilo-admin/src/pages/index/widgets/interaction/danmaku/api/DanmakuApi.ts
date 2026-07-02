import request from "@/shared/lib/request";
import { Api } from "@/shared/config/Api";
import type { Danmaku } from "@/pages/index/widgets/interaction/danmaku/model/Danmaku";

export const DanmakuApi = {
  /**
   * 获取弹幕管理信息数量
   * @param nameFuzzy 名称模糊查询
   */
  async loadDanmakuCount(nameFuzzy?: string): Promise<number | null> {
    const result = await request({
      method: "get",
      url: Api.danmakuCount,
      params: { nameFuzzy },
    });
    if (!result) return null;
    return (result.data ?? 0) as number;
  },

  /**
   * 获取弹幕管理信息
   * @param pageNo    页号（从1开始）
   * @param pageSize  页大小（1-10）
   * @param nameFuzzy 名称模糊查询
   */
  async loadDanmakuList(
    pageNo: number,
    pageSize: number,
    nameFuzzy?: string,
  ): Promise<Danmaku[] | null> {
    const result = await request({
      method: "get",
      url: `${Api.danmakuList}/${pageNo}/${pageSize}`,
      params: { nameFuzzy },
    });
    if (!result) return null;
    return (result.data ?? []) as Danmaku[];
  },

  /**
   * 删除视频弹幕
   * @param danmakuId 弹幕ID
   */
  async deleteDanmaku(danmakuId: string) {
    return request({
      method: "delete",
      url: `${Api.danmakuDelete}/${danmakuId}`,
    });
  },
} as const;
