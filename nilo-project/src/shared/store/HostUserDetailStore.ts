import { defineStore } from "pinia";
import type { UserDetail } from "@/shared/model/UserDetail";

/** 个人主页标签栏上的数量 */
export type UserHomeCountKind = "upload" | "series" | "collection";

export const useHostUserDetailStore = defineStore("userDetail", {
  state() {
    return {
      /** 用户主页详情 */
      userHostDetail: null as UserDetail | null,
      /** 投稿 / 系列 / 收藏数量，null 表示还没拿到 */
      counts: {
        upload: null,
        series: null,
        collection: null,
      } as Record<UserHomeCountKind, number | null>,
    };
  },
  actions: {
    setUserDetail(detail: UserDetail | null) {
      this.userHostDetail = detail;
    },
    setTheme(theme: number) {
      if (this.userHostDetail) {
        this.userHostDetail.theme = theme;
      }
    },
    clearUserDetail() {
      this.userHostDetail = null;
    },
    setCount(kind: UserHomeCountKind, count: number | null | undefined) {
      if (count == null || !Number.isFinite(count)) return;
      this.counts[kind] = Math.max(0, count);
    },
    resetCounts() {
      this.counts = { upload: null, series: null, collection: null };
    },
  },
});
