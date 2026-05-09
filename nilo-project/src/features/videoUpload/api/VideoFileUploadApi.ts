import { Api } from "@/shared/config/Api";
import request from "@/shared/lib/request";
import type { AxiosProgressEvent } from "axios";
import type { VideoUpload } from "../model/VideoUpload";

export const VideoFileUploadApi = {
  /**
   * 预上传视频文件
   * 上传视频文件分块数，验证用户token
   *
   * @param chunkSize 视频文件分块数
   * @returns uploadId，用于指定唯一视频文件（一个视频文件可能被分为多个块）
   */
  async preUploadVideo(
    chunkSize: number,
    signal?: AbortSignal,
  ): Promise<string | null> {
    const result = await request({
      method: "post",
      url: Api.preUploadVideo,
      params: {
        chunkSize,
      },
      signal,
    });
    if (!result) {
      return null;
    }
    return String(result.data);
  },

  /**
   * 上传视频文件（的一块）
   * 上传具体视频文件，通过uploadId指明所属具体视频，通过chunkIndex指明是第几块
   * 会将视频文件临时保存在服务器中
   *
   * @param chunkFile 视频文件块
   * @param chunkIndex 块序号（第几块）
   * @param uploadId 预上传返回的uploadId
   * @param uploadProgressCallback 上传进度回调
   */
  async uploadVideo(
    chunkFile: File,
    chunkIndex: number,
    uploadId: string,
    uploadProgressCallback?: (event: AxiosProgressEvent) => void,
    signal?: AbortSignal,
  ): Promise<boolean> {
    const result = await request({
      method: "post",
      url: Api.uploadVideo,
      params: {
        chunkIndex,
        uploadId,
      },
      data: {
        chunkFile,
      },
      dataType: "form",
      uploadProgressCallback,
      signal,
    });
    return result !== null;
  },

  /**
   * 删除上传的视频文件
   *
   * @param uploadId uploadId
   * @returns 无内容
   */
  async deleteVideo(uploadId: string, signal?: AbortSignal): Promise<boolean> {
    const result = await request({
      method: "delete",
      url: Api.delUploadVideo,
      params: {
        uploadId,
      },
      signal,
    });
    return result !== null;
  },

  /**
   * 上传/修改视频信息
   *
   * @param data 视频上传信息
   */
  async postVideo(data: VideoUpload): Promise<boolean> {
    const result = await request({
      method: "post",
      url: Api.postVideo,
      data: {
        ...data,
        // 后端接收 videoFileUploadList，其中每个元素的 uploadId / filename 字段名与前端一致
      } as unknown as Record<string, any>,
    });
    return result.code === 200;
  },
};
