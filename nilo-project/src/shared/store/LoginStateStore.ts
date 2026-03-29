import { defineStore } from 'pinia'
import { type UserInfo } from '@/entities/model/UserInfo'
import type { UserRelation } from '@/entities/model/UserRelation';

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
            userInfo: null as UserInfo | null,
            /**
             * 用户的关注粉丝数量
             */
            userRelation: null as UserRelation | null
        }
    },
    actions: {
        setLoginState(state: boolean) {
            this.loginState = state;
        },
        setUserInfo(userInfo: UserInfo | null) {
            this.userInfo = userInfo;
        },
        setUserRelation(userRelation: UserRelation | null) {
            this.userRelation = userRelation;
        }
    }
})
