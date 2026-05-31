import { defineStore } from "pinia";
import type { BriefUserInfo } from "../model/BriefUserInfo";

export const useLoginStateStore = defineStore("loginState", {
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
      followerCount: null as number | null,
      followingCount: null as number | null,
      currentCoin: null as number | null,
    };
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
    increseFollowingCount() {
      if (this.followingCount != null) {
        this.followingCount += 1;
      }
    },
    decreaseFollowingCount() {
      if (this.followingCount != null) {
        this.followingCount -= 1;
      }
    },
    /**
     * cost specified amount of coin
     * @param count amount of coin cost
     */
    costCoin(count: number) {
      if (this.currentCoin != null) {
        this.currentCoin -= count;
      }
    },
  },
});
