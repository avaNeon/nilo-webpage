import Cookies from "js-cookie";
import { useLoginStateStore } from "@/shared/store/LoginStateStore";
import { useAccount } from "@/shared/composables/useAccount";
import { AccountApi } from "../api/AccountApi";

let autoLoginPromise: Promise<boolean> | null = null;

async function performAutoLogin(): Promise<boolean> {
  const token = Cookies.get("token_normal");
  if (!token) {
    return false;
  }

  const loginStateStore = useLoginStateStore();
  const { saveUserState } = useAccount();
  const tokenUserInfo = await AccountApi.autoLogin();
  if (tokenUserInfo != null) {
    loginStateStore.setLoginState(true);
    loginStateStore.setUserInfo(tokenUserInfo.userInfo);
    loginStateStore.showPanel = false;
    await saveUserState();
    return true;
  }
  return false;
}

/**
 * 获取自动登录结果，全局只执行一次
 */
export function getAutoLoginPromise(): Promise<boolean> {
  if (autoLoginPromise == null) {
    autoLoginPromise = performAutoLogin();
  }
  return autoLoginPromise;
}
