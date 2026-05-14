import { Api } from "@/shared/config/Api";
import request from "@/shared/lib/request";
import type { AxiosProgressEvent } from "axios";
import type { VideoUpload } from "@/features/videoUpload/model/VideoUpload";

export const videoUploadApi = {
  async preUploadVideo(
    chunkSize: number,
    signal?: AbortSignal,
  ): Promise<string | null> {
    const result = await request({
      method: "post",
      url: Api.preUploadVideo,
      params: { chunkSize },
      signal,
    });
    if (!result) return null;
    return String(result.data);
  },

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
      params: { chunkIndex, uploadId },
      data: { chunkFile },
      dataType: "form",
      uploadProgressCallback,
      signal,
    });
    return result !== null;
  },

  async deleteVideo(uploadId: string, signal?: AbortSignal): Promise<boolean> {
    const result = await request({
      method: "delete",
      url: Api.delUploadVideo,
      params: { uploadId },
      signal,
    });
    return result !== null;
  },

  async postVideo(data: VideoUpload): Promise<boolean> {
    const result = await request({
      method: "post",
      url: Api.postVideo,
      data: {
        ...data,
      } as unknown as Record<string, any>,
    });
    return result.code === 200;
  },
};

