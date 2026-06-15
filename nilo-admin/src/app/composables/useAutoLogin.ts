import { AdminApi } from "@/shared/api/AdminApi";
import { useLoginStateStore } from "@/shared/store/LoginStateStore";

/**
 * auto-login related composables
 */
export function useAutoLogin() {
  const loginStateStore = useLoginStateStore();

  /**
   * auto-login
   * if auto-login success, return true
   */
  async function autoLogin(): Promise<boolean> {
    const tokenAdminInfo = await AdminApi.autoLogin();

    if (tokenAdminInfo) {
      loginStateStore.setLoginState(true);
      loginStateStore.setUserInfo(tokenAdminInfo);
      return true;
    } else {
      return false;
    }
  }

  return { autoLogin };
}
