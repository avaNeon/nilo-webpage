import request from "@/shared/lib/request";
import { Api } from "@/shared/config/Api";

/**
 * 用户行为相关业务逻辑
 */
export const userApi = {
    /**
     * 执行用户操作（例如点赞、投币、收藏等）
     * @param config 操作参数
     * @param callback 操作成功后的回调函数
     */
    async doUserAction(config: any, callback: () => void) {
        let result = await request({
            method: "post",
            url: Api.userAction,
            params: config,
            showLoading: true,
        })
        if (!result) {
            return;
        }
        callback()
    }
}
