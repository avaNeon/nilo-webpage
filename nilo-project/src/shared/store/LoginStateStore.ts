import { defineStore } from 'pinia'
import type { BriefUserInfo } from '../model/BriefUserInfo';

export const useLoginStateStore = defineStore('loginState', {
    state() {
        return {
            /**
             * 控制展示登录面板的状态
             */
            showPanel: false,
            /**
             * 登录状态，true 表示已登录，false 表示未登录
             */
            loginState: false,
            /**
             * 用户信息
             */
            userInfo: null as BriefUserInfo | null,
            /**
             * 用户的关注粉丝数量
             */
            followerCount: 0,
            followingCount: 0,
            currentCoin: 0,
        }
    },
    actions: {
        setLoginState(state: boolean) {
            this.loginState = state;
        },
        setUserInfo(userInfo: BriefUserInfo | null) {
            this.userInfo = userInfo;
        },
        setFollowerCount(count: number) {
            this.followerCount = count;
        },
        setFollowingCount(count: number) {
            this.followingCount = count;
        },
        setCurrentCoin(count: number) {
            this.currentCoin = count;
        },
    }
})
