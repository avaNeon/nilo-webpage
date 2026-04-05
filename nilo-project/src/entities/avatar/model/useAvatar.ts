import { useLoginStateStore } from '@/shared/store/LoginStateStore';
import request from '@/shared/lib/request';
import { Api } from '@/shared/config/Api';
import message from '@/shared/lib/message';
import confirm from '@/shared/lib/confirm';

export function useAvatar() {
    const loginStateStore = useLoginStateStore();

    function clickLogin() {
        loginStateStore.showPanel = true;
    }

    async function getUserRelation() {
        const result = await request({ method: 'get', url: Api.getUserRelation })
        if (!result?.data) {
            return
        }
        loginStateStore.setFollowerCount(result.data.followerCount)
        loginStateStore.setFollowingCount(result.data.followingCount)
        loginStateStore.setCurrentCoin(result.data.currentCoin)
    }

    function logout() {
        confirm({
            message: "确定要退出登录吗？",
            async confirmFun() {
                const result = await request({ method: 'get', url: Api.logout })
                if (!result?.data) {
                    return
                }
                if (result.data) {
                    message.success("成功登出！")
                    loginStateStore.setLoginState(false)
                    loginStateStore.setUserInfo(null)
                    loginStateStore.setFollowerCount(0)
                    loginStateStore.setFollowingCount(0)
                    loginStateStore.setCurrentCoin(0)
                }
            }
        })
    }

    return {
        loginStateStore,
        clickLogin,
        getUserRelation,
        logout,
    }
}
