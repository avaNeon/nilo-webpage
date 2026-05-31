import { useLoginStateStore } from "@/shared/store/LoginStateStore";
import message from "@/shared/lib/message";
import { AccountApi } from "../api/AccountApi";

/**
 * auto-login related composables
 */
export function useAutoLogin() {
  const loginStateStore = useLoginStateStore();

  /**
   * auto-login
   * only load non-statistical user info
   */
  async function autoLogin(): Promise<void> {
    const tokenUserInfo = await AccountApi.autoLogin();
    if (tokenUserInfo != null) {
      loginStateStore.setLoginState(true);
      loginStateStore.setUserInfo(tokenUserInfo.userInfo);
      loginStateStore.showPanel = false;
      message.success(`欢迎回来！ ${tokenUserInfo.userInfo.nickName}`);
    }
  }

  return { autoLogin };
}
