import { Api } from "@/shared/config/Api";
import request from "@/shared/lib/request";
import type { BaseResponse } from "@/shared/model/BaseResponse";
import type { VideoStatusCount } from "@/widgets/VideoManagement/model/VideoStatusCount";
import type { VideoUploadInfo } from "@/widgets/VideoManagement/model/VideoUploadInfo";

export const VideoManagementApi = {
  /**
   * 获取不同状态视频的数量
   */
  async getVideoStatusCount(
    nameFuzzy: string | undefined,
  ): Promise<VideoStatusCount | null> {
    const result = await request({
      method: "get",
      url: Api.ccLoadVideoCount,
      params: { nameFuzzy },
    });
    if (!result) {
      return null;
    }
    return result.data as VideoStatusCount;
  },

  /**
   * 查询用户上传视频列表
   *
   * @param status    视频状态：<br/>
   *                  -1：进行中（包括：0：转码中、1：转码失败、2：转码成功，未审核）<br/>
   *                  3：已通过、4：未通过
   * @param pageNo    页号
   * @param pageSize  页大小
   * @param nameFuzzy 名称（模糊搜索）
   */
  async loadVideoList(
    status: number | undefined,
    pageNo: number,
    pageSize: number,
    nameFuzzy: string | undefined,
  ): Promise<VideoUploadInfo[] | null> {
    const params: Record<string, unknown> = {
      pageNo,
      pageSize,
    };
    if (status !== undefined) {
      params.status = status;
    }
    if (nameFuzzy !== undefined) {
      params.nameFuzzy = nameFuzzy;
    }
    const result = await request({
      method: "get",
      url: Api.ccLoadVideoList,
      params,
    });
    if (!result) {
      return null;
    }
    return result.data as VideoUploadInfo[];
  },

  /**
   * 删除视频
   *
   * @param videoId 视频ID
   * @param detail  删除原因详情
   */
  async deleteVideo(
    videoId: string,
    detail: string,
  ): Promise<BaseResponse<null> | null> {
    const result = await request({
      method: "delete",
      url: Api.ccDeleteVideo + videoId,
      params: { detail },
    });
    if (result === undefined || result === null) {
      return null;
    }
    return result;
  },

  /**
   * 更改视频互动权限（弹幕/评论开关）
   *
   * @param videoId     视频ID
   * @param interaction 互动设置值，如 "0"（关闭弹幕）、"1"（关闭评论）、"0,1"（都关闭）
   */
  async setInteraction(
    videoId: string,
    interaction: string,
  ): Promise<Object | null> {
    const result = await request({
      method: "post",
      url: Api.ccVideoInteraction + videoId,
      params: { interaction },
    });
    if (!result) {
      return null;
    }
    return result.data as Object;
  },
} as const;
