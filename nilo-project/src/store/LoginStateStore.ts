import { defineStore } from 'pinia'
import { type UserInfo } from '../models/UserInfo'
import type { UserRelation } from '../models/UserRelation';

export const useLoginStateStore = defineStore('loginState', {
    state() {
        return {
            showPanel: false,
            loginState: false,
            userInfo: null as UserInfo | null,
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