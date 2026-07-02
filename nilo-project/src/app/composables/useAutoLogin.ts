import { useLoginStateStore } from "@/shared/store/LoginStateStore";
import message from "@/shared/lib/message";
import { AccountApi } from "../api/AccountApi";

let autoLoginPromise: Promise<boolean> | null = null;

async function performAutoLogin(): Promise<boolean> {
  const loginStateStore = useLoginStateStore();
  const tokenUserInfo = await AccountApi.autoLogin();
  if (tokenUserInfo != null) {
    loginStateStore.setLoginState(true);
    loginStateStore.setUserInfo(tokenUserInfo.userInfo);
    loginStateStore.showPanel = false;
    message.success(`欢迎回来！ ${tokenUserInfo.userInfo.nickName}`);
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
