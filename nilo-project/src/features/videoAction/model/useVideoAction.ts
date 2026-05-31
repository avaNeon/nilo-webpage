import { ref, watch } from "vue";
import * as VideoActionApi from "@/features/videoAction/api/VideoActionApi";
import { useRoute } from "vue-router";
import useVideoStateStore from "@/pages/videoDetail/store/VideoStateStore";
import { useLoginStateStore } from "@/shared/store/LoginStateStore";
import { useVideoActionStateStore } from "@/features/videoAction/store/VideoActionStateStore";
import { useVideoActionUiStore } from "../store/VideoActionUiStore";
import message from "@/shared/lib/message";
import { UserVideoAction } from "@/shared/constant/UserVideoActionEnum";

export function useVideoAction() {
  const videoState = useVideoStateStore();
  const loginState = useLoginStateStore();
  const videoActionState = useVideoActionStateStore();
  const videoActionUiStore = useVideoActionUiStore();
  const route = useRoute();

  /**
   * Fetches the current user's video action status for the video.
   */
  async function getVideoAction() {
    // if user is not logged in, just return
    if (loginState.loginState === false) {
      return;
    }

    // else fetch video action status for the current user
    const result = await VideoActionApi.getVideoAction(
      route.params.videoId as string,
    );
    // reset before update, so cancel-actions (unlike, uncollect) are reflected correctly
    videoActionState.reset();
    if (!result) {
      return;
    }
    for (const videoAction of result) {
      switch (videoAction.actionType) {
        case UserVideoAction.like:
          videoActionState.liked = true;
          break;
        case UserVideoAction.collect:
          videoActionState.collected = true;
          break;
        case UserVideoAction.coin:
          videoActionState.coin = videoAction.coinAmount;
          break;
      }
    }
  }

  /**
   * Do a video action
   * @param actionType action type
   * @param coinAmount amount of coin
   * @returns if this action is successful
   */
  async function doVideoAction(
    actionType: number,
    coinAmount?: number,
  ): Promise<boolean> {
    const result = await VideoActionApi.videoAction(
      route.params.videoId as string,
      actionType,
      coinAmount,
    );
    if (result && result.code === 200) {
      if (actionType === UserVideoAction.coin) {
        message.success("投币成功");
      }
      await getVideoAction();
      return true;
    } else {
      return false;
    }
  }

  // autoLogin 是异步的，组件 onMounted 时登录状态可能还未就绪
  // 监听登录状态，登录完成后自动拉取一次操作状态
  watch(
    () => loginState.loginState,
    loggedIn => {
      if (loggedIn) {
        getVideoAction();
      }
    },
  );

  function checkLogin(): boolean {
    if (loginState.loginState === false) {
      message.warning("请先登录");
      loginState.showPanel = true;
      return false;
    }
    return true;
  }

  function openCoinDialog() {
    if (!checkLogin()) {
      return;
    }
    videoActionUiStore.openCoinDialog();
  }

  /**
   * coin amount chosen by user to send
   */
  const coinAmount = ref(0);

  /**
   * update coin amount to be sent to backend when user clicks the "投币" button in the CoinDialog
   * @param amount coin amount
   */
  function updateCoinAmount(amount: number) {
    if (amount === 1 || amount === 2) {
      coinAmount.value = amount;
    }
  }

  return {
    videoState,
    videoActionState,
    coinAmount,
    getVideoAction,
    doVideoAction,
    checkLogin,
    openCoinDialog,
    updateCoinAmount,
  };
}
