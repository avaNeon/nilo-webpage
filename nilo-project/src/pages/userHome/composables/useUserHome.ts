import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { UserHomeApi } from "@/pages/userHome/api/UserHomeApi";
import { useHostUserDetailStore } from "@/shared/store/UserDetailStore";
import { useLoginStateStore } from "@/shared/store/LoginStateStore";
import { FollowApi } from "@/shared/api/FollowApi";
import message from "@/shared/lib/message";

export function useUserHome() {
  /* ————————工具———————— */
  const route = useRoute();
  const loginStateStore = useLoginStateStore();

  /* ————————状态———————— */
  const userDetailStore = useHostUserDetailStore();

  /** 校验当前主页用户是否是自己 */
  const isMySelf = computed(() => {
    if (
      userDetailStore.userHostDetail !== null &&
      loginStateStore.userInfo !== null
    ) {
      return (
        userDetailStore.userHostDetail.userId ==
        loginStateStore.userInfo.userId
      );
    }
    return false;
  });

  /* ——————初始化函数—————— */

  async function loadUserDetail() {
    const hostUserId = route.params.userId as string;
    if (!hostUserId) return;

    const detail = await UserHomeApi.getUserDetail(hostUserId);
    if (detail) {
      userDetailStore.setUserDetail(detail);
    }
  }

  /** 关注 */
  async function subscribe() {
    if (!loginStateStore.loginState) {
      loginStateStore.showPanel = true;
      return;
    }
    const detail = userDetailStore.userHostDetail;
    if (!detail) return;
    if (isMySelf.value) {
      message.warning("不能关注自己");
      return;
    }
    await FollowApi.follow(detail.userId!);
    detail.hasFollowed = true;
    detail.followerCount++;
    loginStateStore.increseFollowingCount();
  }

  /** 取消关注 */
  async function unsubscribe() {
    if (!loginStateStore.loginState) {
      loginStateStore.showPanel = true;
      return;
    }
    const detail = userDetailStore.userHostDetail;
    if (!detail) return;
    if (isMySelf.value) {
      message.warning("不能对自己做这个操作");
      return;
    }
    await FollowApi.follow(detail.userId!);
    detail.hasFollowed = false;
    detail.followerCount--;
    loginStateStore.decreaseFollowingCount();
  }

  onMounted(() => {
    loadUserDetail();
  });

  return {
    isMySelf,
    loadUserDetail,
    subscribe,
    unsubscribe,
  };
}
