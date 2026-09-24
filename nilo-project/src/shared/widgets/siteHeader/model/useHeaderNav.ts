import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { MessageApi } from "@/shared/api/MessageApi";
import { useLoginStateStore } from "@/shared/store/LoginStateStore";
import { routerToNewPage } from "@/shared/utils/RouteUtil";

/**
 * 顶栏导航：需登录的跳转、未读消息数、联系方式弹窗
 * IndexHeader 与 SiteHeader 共用
 */
export function useHeaderNav() {
  const loginStateStore = useLoginStateStore();

  /*——————状态—————— */

  const showContactDialog = ref(false);
  const uncheckedMessageCount = ref(0);
  const uncheckedMessageCountText = computed(() =>
    uncheckedMessageCount.value > 99
      ? "99+"
      : String(uncheckedMessageCount.value),
  );

  /*——————方法—————— */

  /** 未登录时弹出登录面板，已登录则在新标签页打开 */
  function requireLoginThen(pathOrFactory: string | (() => string)) {
    if (!loginStateStore.loginState || !loginStateStore.userInfo?.userId) {
      loginStateStore.showPanel = true;
      return;
    }
    const path =
      typeof pathOrFactory === "function" ? pathOrFactory() : pathOrFactory;
    routerToNewPage(path);
  }

  async function loadUncheckedMessageCount() {
    const messageCount = await MessageApi.getUncheckedMessageCount();
    uncheckedMessageCount.value =
      (messageCount?.systemMessageCount ?? 0) +
      (messageCount?.likeMessageCount ?? 0) +
      (messageCount?.collectMessageCount ?? 0) +
      (messageCount?.commentMessageCount ?? 0);
  }

  // 等 loginState 就绪后再拉未读数，避免未登录/autoLogin 未完成时误请求
  watch(
    () => loginStateStore.loginState,
    loggedIn => {
      if (loggedIn) {
        loadUncheckedMessageCount();
      } else {
        uncheckedMessageCount.value = 0;
      }
    },
    { immediate: true },
  );

  // 消息中心在新标签页打开，看完切回来时重新拉一次，角标数字不会停在旧值
  function onVisibilityChange() {
    if (document.visibilityState === "visible" && loginStateStore.loginState) {
      loadUncheckedMessageCount();
    }
  }

  onMounted(() => document.addEventListener("visibilitychange", onVisibilityChange));
  onBeforeUnmount(() => document.removeEventListener("visibilitychange", onVisibilityChange));

  return {
    loginStateStore,
    showContactDialog,
    uncheckedMessageCount,
    uncheckedMessageCountText,
    requireLoginThen,
  };
}
