import request from "@/shared/lib/request";
import { Api } from "@/shared/config/Api";
import type { AxiosProgressEvent } from "axios";

export const FileApi = {
  /**
   * 上传图片，可选是否生成缩略图
   *
   * @param file            图片文件
   * @param createThumbnail 是否创建缩略图，默认 false
   * @param onProgress      上传进度回调（可选）
   * @returns 上传成功后的图片相对路径
   */
  async uploadImage(
    file: File,
    createThumbnail: boolean = false,
    onProgress?: (event: AxiosProgressEvent) => void,
  ): Promise<string | undefined> {
    const result = await request({
      method: "put",
      url: Api.uploadImage,
      params: { createThumbnail },
      data: { MultipartFile: file },
      dataType: "form",
      uploadProgressCallback: onProgress,
    });
    if (!result) return;
    return result.data as string;
  },

  /**
   * 获取图片
   *
   * @param sourceName 图片相对路径
   * @param tmp        是否为临时文件，默认 false
   * @returns 图片文件的 ArrayBuffer
   */
  async downloadImage(
    sourceName: string,
    tmp: boolean = false,
  ): Promise<ArrayBuffer | undefined> {
    const result = await request({
      method: "get",
      url: Api.downloadImage,
      params: { sourceName, tmp },
      responseType: "arraybuffer",
    });
    if (!result) return;
    return result as unknown as ArrayBuffer;
  },
};
