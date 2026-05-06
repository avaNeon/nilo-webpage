import request from "@/shared/lib/request";
import { Api } from "@/shared/config/Api";
import type { AxiosProgressEvent } from "axios";

/**
 * 图片相关 API
 */
export const imageApi = {
    /**
     * 上传图片
     * @param file 图片文件
     * @param createThumbnail 是否创建缩略图
     * @param onProgress 上传进度回调
     * @returns 服务器返回的文件路径字符串
     */
    async uploadImage(
        file: File,
        createThumbnail = false,
        onProgress?: (event: AxiosProgressEvent) => void,
    ) {
        const result = await request({
            method: "put",
            url: Api.uploadImage,
            data: {
                file,
                createThumbnail,
            },
            dataType: "form",                 // ← 触发 FormData 构建
            uploadProgressCallback: onProgress, // ← 上传进度
        })
        if (!result) {
            return;
        }
        return result.data;
    },
}

