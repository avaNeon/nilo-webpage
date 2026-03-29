import { useLoginStateStore } from '@/shared/store/LoginStateStore'
import { Api } from '@/shared/config/Api'
import request from '@/shared/lib/request'
import message from '@/shared/lib/message'
import { ServiceType } from '@/entities/model/ServiceType'

/**
 * 自动登录
 * @returns 自动登录函数
 */
export function useAutoLogin() {
    const loginStateStore = useLoginStateStore()

    async function autoLogin() {
        const result = await request({ method: 'get', url: Api.autoLogin, serviceType: ServiceType.web })
        if (!result?.data) {
            return
        }
        loginStateStore.setLoginState(true)
        loginStateStore.setUserInfo(result.data)
        loginStateStore.showPanel = false
        message.success(`欢迎回来！ ${result.data.nickName}`)
    }

    return { autoLogin }
}
