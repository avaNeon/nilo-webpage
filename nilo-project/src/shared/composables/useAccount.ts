import { UserApi } from "../api/userApi";
import { useLoginStateStore } from "../store/LoginStateStore";

/**
 * account info related composables
 */
export function useAccount() {
  /**
   * load & save user stastistical info
   * attention: it may takes more time
   */
  async function saveUserState() {
    const loginStateStore = useLoginStateStore();
    const userState = await UserApi.getUserState();
    if (userState) {
      loginStateStore.setFollowerCount(userState.followerCount);
      loginStateStore.setFollowingCount(userState.followingCount);
      loginStateStore.setCurrentCoin(userState.currentCoin);
    }
  }
  return { saveUserState };
}
