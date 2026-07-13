import request from "@/shared/lib/request";
import { Api } from "@/shared/config/Api";
import type { AxiosProgressEvent } from "axios";

export const FileApi = {
  /** 上传图片（服务端始终出缩略图），返回 plain key */
  async uploadImage(
    file: File,
    onProgress?: (event: AxiosProgressEvent) => void,
  ): Promise<string | undefined> {
    const result = await request({
      method: "put",
      url: Api.uploadImage,
      data: { file },
      dataType: "form",
      uploadProgressCallback: onProgress,
    });
    if (!result) return;
    return result.data as string;
  },

  /** pending / 私有图的预签名 URL（admin 参数名为 key） */
  async getPresignedImageUrl(key: string): Promise<string | undefined> {
    const result = await request({
      method: "get",
      url: Api.downloadImage,
      params: { key },
    });
    if (!result) return;
    return result.data as string;
  },
};
