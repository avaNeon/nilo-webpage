import request from "@/shared/lib/request";
import { Api } from "@/shared/config/Api";
import { ServiceType } from "@/shared/model/ServiceType";
import type { TokenUserInfo } from "@/shared/model/TokenUserInfo";

/**
 * 用户行为相关业务逻辑
 */
export const UserApi = {
    /**
     * 执行用户操作（例如点赞、投币、收藏等）
     * @param config 操作参数
     * @param callback 操作成功后的回调函数
     */
    async doUserAction(config: any, callback: () => void) {
        let result = await request({
            method: "post",
            url: Api.userVideoAction,
            params: config,
            showLoading: true,
        })
        if (!result) {
            return;
        }
        callback()
    },

    /**
     * 静默调用自动登录接口，刷新用户登录态信息
     * - 不显示 loading
     * - 不弹出错误提示
     * @returns TokenUserInfo，失败时返回 null
     */
    async autoLogin(): Promise<TokenUserInfo | null> {
        const result = await request({
            method: 'get',
            url: Api.autoLogin,
            serviceType: ServiceType.web,
            showLoading: false,
            showError: false,
        })
        if (!result?.data) {
            return null
        }
        return result.data as TokenUserInfo
    },
}
