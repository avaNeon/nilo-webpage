import { defineStore } from "pinia";
import type { UserDetail } from "@/shared/model/UserDetail";

export const useHostUserDetailStore = defineStore("userDetail", {
  state() {
    return {
      /** 用户主页详情 */
      userHostDetail: null as UserDetail | null,
    };
  },
  actions: {
    setUserDetail(detail: UserDetail | null) {
      this.userHostDetail = detail;
    },
    clearUserDetail() {
      this.userHostDetail = null;
    },
  },
});
