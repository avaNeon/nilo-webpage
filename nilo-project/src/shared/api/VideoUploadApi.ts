import { Api } from "@/shared/config/Api";
import { toPlainKey, videoUploadUrl } from "@/shared/config/Minio";
import request from "@/shared/lib/request";
import type { AxiosProgressEvent } from "axios";
import axios from "axios";
import type { VideoUpload } from "@/pages/creativeCenter/features/videoUpload/model/VideoUpload";

export const videoUploadApi = {
  /** 取预签名表单并直传 MinIO，返回 plain key */
  async uploadVideo(
    file: File,
    uploadProgressCallback?: (event: AxiosProgressEvent) => void,
  ): Promise<string | null> {
    // 先拿预签名 POST 表单
    const result = await request({
      method: "post",
      url: Api.uploadVideo,
      params: { fileSize: file.size },
    });
    if (!result?.data) {
      return null;
    }

    const formFields = result.data as Record<string, string>;
    const objectKey = formFields.key;
    if (!objectKey) {
      return null;
    }

    const formData = new FormData();
    for (const [k, v] of Object.entries(formFields)) {
      if (k === "file") continue;
      formData.append(k, v);
    }
    // Content-Type 须为 video/*，策略才放行
    if (![...formData.keys()].includes("Content-Type")) {
      const contentType = file.type?.startsWith("video/")
        ? file.type
        : "video/mp4";
      formData.append("Content-Type", contentType);
    }
    // file 必须放在最后
    formData.append("file", file, file.name);

    // 直传 MinIO
    await axios.post(videoUploadUrl(), formData, {
      onUploadProgress: uploadProgressCallback,
      // 不要把业务 token 带到 MinIO
      transformRequest: [
        (data, headers) => {
          if (headers) {
            delete headers.token;
            delete headers.Authorization;
            // 交给浏览器设置 multipart boundary
            delete headers["Content-Type"];
          }
          return data;
        },
      ],
    });

    return toPlainKey(objectKey);
  },

  /** 提交稿件 */
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
