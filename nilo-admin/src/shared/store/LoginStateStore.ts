import { defineStore } from "pinia";
import type { TokenAdmin } from "../model/TokenAdmin";

export const useLoginStateStore = defineStore("loginState", {
  state() {
    return {
      /**
       * 是否登录
       */
      loginState: false as boolean,
      /**
       * 管理员信息
       */
      adminInfo: null as TokenAdmin | null,
    };
  },
  actions: {
    setLoginState(loginState: boolean) {
      this.loginState = loginState;
    },
    setUserInfo(tokenAdmin: TokenAdmin | null) {
      this.adminInfo = tokenAdmin;
    },
  },
});
