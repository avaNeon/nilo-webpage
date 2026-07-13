import { Api } from "@/shared/config/Api";
import request from "@/shared/lib/request";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import useVideoStateStore from "../store/VideoStateStore";
import { VideoCommentApi } from "../api/VideoCommentApi";
import type { VideoComment } from "@/shared/model/VideoComment";
import { useLoginStateStore } from "@/shared/store/LoginStateStore";
import { FollowApi } from "@/shared/api/FollowApi";
import message from "@/shared/lib/message";
import { getOrCreateSessionId } from "@/shared/lib/sessionId";
import { setPageTitle } from "@/shared/utils/PageTitle";

// 交互类型常量
export const InteractionType = {
  NO_PROHIBITION: -1,
  NO_DANMAKU: 0,
  NO_COMMENT: 1,
} as const;

export function useVideoDetail() {
  const videoStateStore = useVideoStateStore();
  const loginStateStore = useLoginStateStore();
  const route = useRoute();
  const avatarUrl = computed(
    () => videoStateStore.videoInfo.userInfo?.avatar ?? "",
  );

  // 页面加载状态：初始为 true，loadVideoInfo 完成后置 false
  const loading = ref(true);

  // 视频不存在状态
  const notFound = ref(false);

  // 关注相关状态
  const haveFollowed = ref(false);
  const followerCount = ref(0);

  // 分页相关
  const currentPage = ref(1);
  const PAGE_SIZE = 10;
  const currentSortType = ref("popular");

  async function loadVideoInfo(videoId: string) {
    const sessionId = getOrCreateSessionId();
    const result = await request({
      method: "get",
      url: Api.loadVideoInfo + `/${videoId}`,
      params: { sessionId },
      showError: false,
      errorCallback: responseData => {
        if (responseData.code === 404) {
          notFound.value = true;
        } else {
          message.error(responseData.info);
        }
      },
    });
    loading.value = false;
    if (!result) {
      return;
    }
    notFound.value = false;
    videoStateStore.setVideoInfo(result.data);
  }

  async function loadComments(
    parentCommentId: string,
    pageNo: number,
    orderType: string,
    depth?: number,
  ): Promise<VideoComment[]> {
    if (videoStateStore.videoInfo.videoId) {
      return await VideoCommentApi.getCommentList(
        videoStateStore.videoInfo.videoId,
        parentCommentId,
        pageNo,
        orderType,
        depth,
      );
    } else {
      return [];
    }
  }

  const comments = ref<VideoComment[]>([]);

  /** 追踪每个父评论的下一个分页页码（parentCommentId → nextPageNo） */
  const nextPageMap = new Map<string, number>();

  /**
   * 递归在评论树中查找指定 commentId 的节点
   */
  function findCommentById(
    list: VideoComment[],
    targetId: string,
  ): VideoComment | null {
    for (const item of list) {
      if (item.commentId === targetId) {
        return item;
      }
      if (item.childCommentList && item.childCommentList.length > 0) {
        const found = findCommentById(item.childCommentList, targetId);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  /**
   * 加载某条评论的更多子评论，并追加到其 childCommentList 中
   */
  async function loadMoreChildren(parentCommentId: string) {
    const parent = findCommentById(comments.value, parentCommentId);
    if (!parent) {
      return;
    }

    // 获取下一个页码：如果 parent 已有子评论（第1页已随父评论返回），从第2页继续；
    // 否则（深层嵌套评论，其子评论尚未加载过），从第1页开始
    const hasExistingChildren =
      parent.childCommentList && parent.childCommentList.length > 0;
    const currentPage =
      nextPageMap.get(parentCommentId) ?? (hasExistingChildren ? 2 : 1);
    nextPageMap.set(parentCommentId, currentPage + 1);

    const newChildren = await loadComments(
      parentCommentId,
      currentPage,
      "earliest",
      1,
    );
    if (!newChildren || newChildren.length === 0) {
      parent.hasMoreChildren = false;
      return;
    }

    // 追加到子评论列表
    if (!parent.childCommentList) {
      parent.childCommentList = [];
    }
    parent.childCommentList.push(...newChildren);

    // 服务端返回的 hasMoreChildren 以最后一条为准
    const lastChild = newChildren[newChildren.length - 1];
    parent.hasMoreChildren = lastChild?.hasMoreChildren ?? false;
  }

  const firstLevelCommentCount = ref<number>(0);

  async function loadFirstLevelCommentCount(videoId: string) {
    firstLevelCommentCount.value =
      await VideoCommentApi.getFirstLevelCommentCount(videoId);
  }

  // 关注功能
  function subscribe() {
    if (haveFollowed.value || !loginStateStore.loginState) {
      loginStateStore.showPanel = true;
      return;
    }
    const videoUserId = videoStateStore.videoInfo.userInfo?.userId;
    if (videoUserId != null) {
      if (videoUserId == loginStateStore.userInfo?.userId) {
        message.warning("不能关注自己");
        return;
      } else {
        FollowApi.follow(videoUserId);
      }
    }
    followerCount.value++;
    haveFollowed.value = true;
    // load statistics may takes more time, so we just quickly increase ui following count
    loginStateStore.increseFollowingCount();
  }

  // 取消关注功能
  function unsubscribe() {
    // it won't happen in normal case
    if (!haveFollowed.value || !loginStateStore.loginState) {
      return;
    }
    const videoUserId = videoStateStore.videoInfo.userInfo?.userId;
    if (videoUserId != null) {
      if (videoUserId == loginStateStore.userInfo?.userId) {
        message.warning("不能对自己做这个操作");
        return;
      } else {
        FollowApi.follow(videoUserId);
      }
    }
    followerCount.value--;
    haveFollowed.value = false;
    // load statistics may takes more time, so we just quickly decrease ui following count
    loginStateStore.decreaseFollowingCount();
  }

  // 投币后操作
  function afterCoinAction(cost: number) {
    loginStateStore.costCoin(cost);
    loadVideoInfo(route.params.videoId as string);
  }

  // 分页变化处理
  async function pageChange(page: number) {
    if (route.params.videoId) {
      comments.value = await loadComments("0", page, currentSortType.value);
    }
    // 回到评论区锚点
    const el = document.getElementById("video-comment-section");
    if (el) {
      el.scrollIntoView(true);
    }
  }

  // 按排序类型加载评论
  async function loadCommentsBySortType(sortType: string) {
    comments.value = await loadComments("0", currentPage.value, sortType);
    currentSortType.value = sortType;
  }

  // 获取交互设置
  function getInteraction(): number[] {
    if (!videoStateStore.videoInfo.interaction) {
      return [InteractionType.NO_PROHIBITION];
    }
    const arr = videoStateStore.videoInfo.interaction.split(",");
    return arr.map(str => Number.parseInt(str));
  }

  // 检查评论是否可用
  function isCommentAvailable(): boolean {
    return !getInteraction().includes(InteractionType.NO_COMMENT);
  }

  // 检查弹幕是否可用
  function isDanmakuAvailable(): boolean {
    return !getInteraction().includes(InteractionType.NO_DANMAKU);
  }

  // 初始化加载
  function initLoad() {
    if (route.params.videoId) {
      loadVideoInfo(route.params.videoId as string);
    }
  }

  watch(
    () => videoStateStore.videoInfo.videoId,
    async () => {
      comments.value = await loadComments("0", 1, "popular");
      if (videoStateStore.videoInfo.videoId) {
        await loadFirstLevelCommentCount(videoStateStore.videoInfo.videoId);
      }
      haveFollowed.value =
        videoStateStore.videoInfo.userInfo?.hasFollowed ?? false;
      followerCount.value =
        videoStateStore.videoInfo.userInfo?.followerCount ?? 0;
    },
  );

  watch(
    [() => videoStateStore.videoInfo.videoName, notFound],
    ([videoName, isNotFound]) => {
      if (isNotFound) {
        setPageTitle("视频不存在");
        return;
      }
      setPageTitle(videoName || "视频");
    },
  );

  return {
    // 状态
    avatarUrl,
    comments,
    firstLevelCommentCount,
    haveFollowed,
    followerCount,
    currentPage,
    PAGE_SIZE,
    currentSortType,
    loading,
    notFound,
    // 方法
    loadVideoInfo,
    loadMoreChildren,
    loadComments,
    loadCommentsBySortType,
    subscribe,
    unsubscribe,
    afterCoinAction,
    pageChange,
    getInteraction,
    isCommentAvailable,
    isDanmakuAvailable,
    initLoad,
    // 常量
    InteractionType,
  };
}
