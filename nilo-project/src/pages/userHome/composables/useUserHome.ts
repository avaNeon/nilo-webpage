import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { UserHomeApi } from "@/pages/userHome/api/UserHomeApi";
import { useHostUserDetailStore } from "@/shared/store/HostUserDetailStore";
import { useLoginStateStore } from "@/shared/store/LoginStateStore";
import { FollowApi } from "@/shared/api/FollowApi";
import message from "@/shared/lib/message";
import type { NavItem } from "../model/NavItem";
import { useUserHomeShared } from "../shared/composables/useUserHomeShared";

export function useUserHome() {
  const { isMySelf } = useUserHomeShared();

  // Vite 编译时加载所有背景图
  const bgModules = import.meta.glob("@/assets/userHome-background/*.jpg", {
    eager: true,
  });

  // 从文件名提取 theme 编号 → 图片 URL
  const bgImageMap: Record<number, string> = {};

  for (const [filePath, mod] of Object.entries(bgModules)) {
    const match = filePath.match(/background-(\d+)\.jpg$/);
    if (match) {
      bgImageMap[Number(match[1])] = (mod as { default: string }).default;
    }
  }

  /* ————————数据源———————— */

  const navItems: NavItem[] = [
    {
      label: "首页",
      icon: "icon-home",
      routeName: "userHomeIndex",
      routePath: "",
    },
    {
      label: "投稿",
      icon: "icon-play",
      routeName: "userUpload",
      routePath: "upload",
    },
    {
      label: "系列",
      icon: "icon-playlist",
      routeName: "userVideoSeries",
      routePath: "video",
    },
    {
      label: "收藏",
      icon: "icon-collection",
      routeName: "userCollection",
      routePath: "collection",
    },
  ];

  /* ————————工具———————— */
  const route = useRoute();
  const router = useRouter();
  const loginStateStore = useLoginStateStore();

  /* ————————状态———————— */
  const hostUserDetailStore = useHostUserDetailStore();

  /** 根据 theme 值选择对应的背景图片 */
  const bgStyle = computed(() => {
    const theme = hostUserDetailStore.userHostDetail?.theme ?? 1;
    const url = bgImageMap[theme];
    return url ? { backgroundImage: `url(${url})` } : {};
  });

  const activeRouteName = computed(() => route.name as string);

  /** 搜索关键词 */
  const keyword = ref("");

  /** 是否展示用户信息编辑页面 */
  const showEditor = ref(false);

  /* ————————方法———————— */

  function navigateTo(item: NavItem) {
    router.push({ name: item.routeName });
  }

  function viewFollowing() {
    if (!isMySelf) {
      return;
    }
    // TODO 待实现
  }

  function viewFollower() {
    if (!isMySelf) {
      return;
    }

    // TODO 待实现
  }

  function reloadUserInfo() {
    location.reload();
  }

  /* ——————初始化函数—————— */

  async function loadUserDetail() {
    const hostUserId = route.params.userId as string;
    if (!hostUserId) return;

    const detail = await UserHomeApi.getUserDetail(hostUserId);
    if (detail) {
      hostUserDetailStore.setUserDetail(detail);
    }
  }

  /** 关注 */
  async function subscribe() {
    if (!loginStateStore.loginState) {
      loginStateStore.showPanel = true;
      return;
    }
    const detail = hostUserDetailStore.userHostDetail;
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
    const detail = hostUserDetailStore.userHostDetail;
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
    bgStyle,
    navItems,
    activeRouteName,
    keyword,
    showEditor,
    subscribe,
    unsubscribe,
    navigateTo,
    viewFollowing,
    viewFollower,
    reloadUserInfo,
  };
}
