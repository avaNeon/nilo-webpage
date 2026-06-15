import { Api } from "@/shared/config/Api";
import request from "@/shared/lib/request";

export const quotaApi = {
  /**
   * 获取视频上传额度
   */
  async getRemainingVideoUploadQuota(): Promise<number | null> {
    const result = await request({
      method: "get",
      url: Api.ccVideoUploadQuota,
    });
    if (!result) return null;
    return Number(result.data);
  },

  /**
   * 获取图片上传额度
   */
  async getRemainingImageUploadQuota(): Promise<number | null> {
    const result = await request({
      method: "get",
      url: Api.ccImageUploadQuota,
    });
    if (!result) return null;
    return Number(result.data);
  },
};
