import { Api } from "@/shared/config/Api";
import request from "@/shared/lib/request";
import type { DanmakuManagement } from "@/pages/creativeCenter/widgets/DanmakuManagement/model/DanmakuManagement";

export const DanmakuManagementApi = {
  /**
   * 获取弹幕管理信息数量
   *
   * @param videoId   视频ID（可选）
   * @param fileIndex 视频文件序号（可选）
   * @param nameFuzzy 视频名称模糊搜索（可选）
   */
  async getDanmakuCount(
    videoId: string | undefined,
    fileIndex: number | undefined,
    nameFuzzy: string | undefined,
  ): Promise<number | null> {
    const params: Record<string, unknown> = {};
    if (videoId !== undefined) {
      params.videoId = videoId;
    }
    if (fileIndex !== undefined) {
      params.fileIndex = fileIndex;
    }
    if (nameFuzzy !== undefined) {
      params.nameFuzzy = nameFuzzy;
    }
    const result = await request({
      method: "get",
      url: Api.ccDanmakuCount,
      params,
    });
    if (!result) {
      return null;
    }
    return result.data as number;
  },

  /**
   * 获取弹幕管理信息列表
   *
   * @param videoId   视频ID（可选）
   * @param fileIndex 视频文件序号（可选）
   * @param pageNo    页号（从1开始）
   * @param pageSize  页大小（1-10）
   * @param nameFuzzy 视频名称模糊搜索（可选）
   */
  async getDanmakuList(
    videoId: string | undefined,
    fileIndex: number | undefined,
    pageNo: number,
    pageSize: number,
    nameFuzzy: string | undefined,
  ): Promise<DanmakuManagement[] | null> {
    const params: Record<string, unknown> = {};
    if (videoId !== undefined) {
      params.videoId = videoId;
    }
    if (fileIndex !== undefined) {
      params.fileIndex = fileIndex;
    }
    if (nameFuzzy !== undefined) {
      params.nameFuzzy = nameFuzzy;
    }
    const result = await request({
      method: "get",
      url: Api.ccDanmakuList + "/" + pageNo + "/" + pageSize,
      params,
    });
    if (!result) {
      return null;
    }
    return result.data as DanmakuManagement[];
  },

  /**
   * 删除弹幕
   *
   * @param danmakuId 弹幕ID
   */
  async deleteDanmaku(danmakuId: string): Promise<boolean> {
    const result = await request({
      method: "delete",
      url: Api.delDanmaku + "/" + danmakuId,
    });
    return result !== null && result.code === 200;
  },
} as const;
