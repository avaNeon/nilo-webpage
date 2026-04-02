import type { FileInfo } from "@/shared/model/FileInfo";
import request from "@/shared/lib/request";
import { Api } from "@/shared/config/Api";

/**
 * 图片相关 API
 */
export const imageApi = {
    /**
     * 上传图片
     * @param file 文件信息
     * @param createThumbnail 是否创建缩略图
     * @returns 文件保存路径
     */
    async uploadImage(file: FileInfo, createThumbnail = false) {
        let result = await request({
            method: "post",
            url: Api.uploadImage,
            params: {
                file,
                createThumbnail
            },
        })
        if (!result) {
            return;
        }
        return result.data;
    },
}
