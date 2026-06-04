import { useLoginStateStore } from "@/shared/store/LoginStateStore";
import { useHostUserDetailStore } from "@/shared/store/HostUserDetailStore";
import { computed } from "vue";

export function useUserHomeShared() {
  const loginStateStore = useLoginStateStore();
  const hostUserDetailStore = useHostUserDetailStore();

  /** 校验当前主页用户是否是自己 */
  const isMySelf = computed(() => {
    if (
      hostUserDetailStore.userHostDetail !== null &&
      loginStateStore.userInfo !== null
    ) {
      return (
        hostUserDetailStore.userHostDetail.userId ==
        loginStateStore.userInfo.userId
      );
    }
    return false;
  });

  return { isMySelf };
}
