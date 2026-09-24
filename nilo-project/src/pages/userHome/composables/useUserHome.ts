import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { UserHomeApi } from "@/pages/userHome/api/UserHomeApi";
import { UserHomeSharedApi } from "@/pages/userHome/shared/api/UserHomeSharedApi";
import { UserHomeVideoSeriesApi } from "@/pages/userHome/widgets/userHomeVideoSeries/api/UserHomeVideoSeriesApi";
import { UserHomeCollectionApi } from "@/pages/userHome/widgets/userHomeCollection/api/UserHomeCollectionApi";
import {
  useHostUserDetailStore,
  type UserHomeCountKind,
} from "@/shared/store/HostUserDetailStore";
import { useLoginStateStore } from "@/shared/store/LoginStateStore";
import { FollowApi } from "@/shared/api/FollowApi";
import message from "@/shared/lib/message";
import confirm from "@/shared/lib/confirm";
import { setPageTitle } from "@/shared/utils/PageTitle";
import type { NavItem } from "../model/NavItem";
import { useUserHomeShared } from "../shared/composables/useUserHomeShared";

/** 后端没存主题时用第 1 张壁纸 */
const DEFAULT_THEME = 1;

/** 偏暗的壁纸（夜空、暗色特写），玻璃要更白一些字才看得清 */
const DARK_WALLPAPERS = new Set([2, 8]);

export function useUserHome() {
  const { isMySelf } = useUserHomeShared();

  /* ——————初始化：Vite 编译时加载所有背景图，静态数据源不变化—————— */

  const bgImageMap: Record<number, string> = {};

  const bgModules = import.meta.glob("@/assets/userHome-background/*.jpg", {
    eager: true,
  });

  for (const [filePath, mod] of Object.entries(bgModules)) {
    const match = filePath.match(/background-(\d+)\.jpg$/);
    if (match) {
      bgImageMap[Number(match[1])] = (mod as { default: string }).default;
    }
  }

  /* ————————数据源———————— */

  const navItems: NavItem[] = [
    { label: "首页", routeName: "userHomeIndex", countKind: null },
    { label: "投稿", routeName: "userUpload", countKind: "upload" },
    { label: "系列", routeName: "userVideoSeries", countKind: "series" },
    { label: "收藏", routeName: "userCollection", countKind: "collection" },
  ];

  /* ————————工具———————— */
  const route = useRoute();
  const router = useRouter();
  const loginStateStore = useLoginStateStore();

  /* ————————状态———————— */
  const hostUserDetailStore = useHostUserDetailStore();

  const hostUserId = computed(() => route.params.userId as string | undefined);

  // 页面加载状态：初始为 true，loadUserDetail 完成后置 false
  const loading = ref(true);

  // 用户不存在状态
  const notFound = ref(false);

  /** 当前后端存储的壁纸序号 */
  const currentThemeIndex = computed(
    () => hostUserDetailStore.userHostDetail?.theme ?? DEFAULT_THEME,
  );

  /** 预览壁纸序号，null 表示无预览，使用后端主题 */
  const previewIndex = ref<number | null>(null);

  /** 正在显示的壁纸序号（预览优先） */
  const wallpaperIndex = computed(() => {
    const index = previewIndex.value ?? currentThemeIndex.value;
    return bgImageMap[index] ? index : DEFAULT_THEME;
  });

  const wallpaperUrl = computed(() => bgImageMap[wallpaperIndex.value] ?? "");

  const wallpaperDark = computed(() => DARK_WALLPAPERS.has(wallpaperIndex.value));

  /** 预览壁纸：index 为 null 时清除预览 */
  function setPreviewWallpaper(index: number | null) {
    previewIndex.value = index;
  }

  /** 系列详情、粉丝/关注列表不算在四个标签里，系列详情仍然高亮「系列」 */
  const activeRouteName = computed(() => route.name as string);

  /** 搜索关键词（与 route.query.keyword 双向同步） */
  const keyword = ref((route.query.keyword as string) || "");

  /** 是否展示用户信息编辑页面 */
  const showEditor = ref(false);

  const showBgImgEditor = ref(false);

  /** 只看壁纸：内容淡出，右下角留返回按钮 */
  const hideUi = ref(false);

  const followPending = ref(false);

  /* ————————方法———————— */

  function navigateTo(item: NavItem) {
    const query: Record<string, string> = {};
    // 跳转到投稿页时携带 keyword
    if (item.routeName === "userUpload" && keyword.value.trim()) {
      query.keyword = keyword.value.trim().substring(0, 100);
    }
    router.push({ name: item.routeName, query });
  }

  /** 搜索：当前在 upload 页则 replace，否则导航到 upload */
  function searchVideos() {
    const trimmed = keyword.value.trim();
    const query = trimmed ? { keyword: trimmed.substring(0, 100) } : {};

    if (activeRouteName.value === "userUpload") {
      router.replace({ name: "userUpload", query });
    } else {
      router.push({ name: "userUpload", query });
    }
  }

  function viewFollowing() {
    if (!isMySelf.value) {
      return;
    }
    router.push({ name: "userFollowingList" });
  }

  function viewFollower() {
    if (!isMySelf.value) {
      return;
    }
    router.push({ name: "userFollowerList" });
  }

  function reloadUserInfo() {
    location.reload();
  }

  /* ——————初始化函数—————— */

  async function loadUserDetail(userId: string) {
    loading.value = true;
    notFound.value = false;

    const detail = await UserHomeApi.getUserDetail(userId, {
      showError: false,
      errorCallback: responseData => {
        if (responseData.code === 404) {
          notFound.value = true;
        } else {
          message.error(responseData.info);
        }
      },
    });
    // 请求期间切到了别人的主页
    if (userId !== hostUserId.value) return;

    loading.value = false;
    if (detail) {
      hostUserDetailStore.setUserDetail(detail);
    }
  }

  /*——————标签栏数量：当前标签页自己会拿到的就不重复请求，其余的并行补上—————— */

  /** 当前标签页加载时会顺带拿到哪些数量 */
  function countsProvidedByRoute(): UserHomeCountKind[] {
    switch (route.name) {
      case "userHomeIndex":
        return ["upload", "series"];
      case "userUpload":
        // 搜索时拿到的是搜索结果数
        return route.query.keyword ? [] : ["upload"];
      case "userVideoSeries":
        return route.params.seriesId ? [] : ["series"];
      case "userCollection":
        return ["collection"];
      default:
        return [];
    }
  }

  function loadMissingCounts(userId: string) {
    const provided = countsProvidedByRoute();
    const isCurrentUser = () => userId === hostUserId.value;

    if (!provided.includes("upload")) {
      UserHomeSharedApi.loadVideo(userId, 1, 10).then(result => {
        if (result && isCurrentUser()) {
          hostUserDetailStore.setCount("upload", result.totalCount ?? 0);
        }
      });
    }

    if (!provided.includes("series")) {
      UserHomeVideoSeriesApi.loadVideoSeries(userId).then(result => {
        if (isCurrentUser()) {
          hostUserDetailStore.setCount("series", result?.length ?? 0);
        }
      });
    }

    if (!provided.includes("collection")) {
      UserHomeCollectionApi.loadCollection(userId, 1).then(result => {
        if (result && isCurrentUser()) {
          hostUserDetailStore.setCount("collection", result.totalCount ?? 0);
        }
      });
    }
  }

  function loadPage(userId: string | undefined) {
    if (!userId) return;

    // 换了主页主人：清掉上一位的资料和数量
    if (hostUserDetailStore.userHostDetail?.userId !== userId) {
      hostUserDetailStore.clearUserDetail();
    }
    hostUserDetailStore.resetCounts();
    previewIndex.value = null;
    hideUi.value = false;

    loadUserDetail(userId);
    loadMissingCounts(userId);
  }

  function requireLogin() {
    if (loginStateStore.loginState) return true;
    loginStateStore.showPanel = true;
    return false;
  }

  /** 关注 */
  async function subscribe() {
    if (!requireLogin() || followPending.value) return;

    const detail = hostUserDetailStore.userHostDetail;
    if (!detail) return;
    if (isMySelf.value) {
      message.warning("不能关注自己");
      return;
    }

    followPending.value = true;
    try {
      await FollowApi.follow(detail.userId!);
      detail.hasFollowed = true;
      detail.followerCount++;
      loginStateStore.increseFollowingCount();
    } finally {
      followPending.value = false;
    }
  }

  /** 取消关注：先确认，防止误点 */
  function unsubscribe() {
    if (!requireLogin() || followPending.value) return;

    const detail = hostUserDetailStore.userHostDetail;
    if (!detail) return;
    if (isMySelf.value) {
      message.warning("不能对自己做这个操作");
      return;
    }

    confirm({
      message: `确定不再关注 ${detail.nickName ?? "TA"} 吗？`,
      confirmText: "取消关注",
      confirmFun: async () => {
        followPending.value = true;
        try {
          await FollowApi.follow(detail.userId!);
          detail.hasFollowed = false;
          detail.followerCount = Math.max(detail.followerCount - 1, 0);
          loginStateStore.decreaseFollowingCount();
        } finally {
          followPending.value = false;
        }
      },
    });
  }

  function toggleFollow() {
    if (hostUserDetailStore.userHostDetail?.hasFollowed) {
      unsubscribe();
    } else {
      subscribe();
    }
  }

  onMounted(() => {
    loadPage(hostUserId.value);
  });

  // 从一个人的主页点到另一个人的主页，组件会复用，这里重新加载
  watch(hostUserId, (newId, oldId) => {
    if (newId && newId !== oldId) {
      loadPage(newId);
    }
  });

  // 当从其他页面通过路由跳转回来时，同步 keyword
  watch(
    () => route.query.keyword,
    newVal => {
      keyword.value = (newVal as string) || "";
    },
  );

  function resolveUserHomeTitle(nickName: string, routeName: string) {
    switch (routeName) {
      case "userUpload":
        return `${nickName}的投稿`;
      case "userVideoSeries":
        return `${nickName}的系列`;
      case "userCollection":
        return `${nickName}的收藏`;
      case "userFollowerList":
        return `${nickName}的粉丝`;
      case "userFollowingList":
        return `${nickName}的关注`;
      default:
        return `${nickName}的主页`;
    }
  }

  watch(
    [
      () => hostUserDetailStore.userHostDetail?.nickName,
      () => route.name,
      notFound,
    ],
    ([nickName, routeName, isNotFound]) => {
      if (isNotFound) {
        setPageTitle("用户不存在");
        return;
      }
      if (!nickName || typeof routeName !== "string") {
        setPageTitle((route.meta.title as string | undefined) || "用户主页");
        return;
      }
      // 系列详情页由系列 composable 用系列名覆盖标题
      if (routeName === "userVideoSeries" && route.params.seriesId) {
        return;
      }
      setPageTitle(resolveUserHomeTitle(nickName, routeName));
    },
  );

  return {
    hideUi,
    isMySelf,
    hostUserId,
    wallpaperIndex,
    wallpaperUrl,
    wallpaperDark,
    navItems,
    activeRouteName,
    keyword,
    showEditor,
    showBgImgEditor,
    currentThemeIndex,
    loading,
    notFound,
    followPending,
    setPreviewWallpaper,
    searchVideos,
    toggleFollow,
    navigateTo,
    viewFollowing,
    viewFollower,
    reloadUserInfo,
  };
}
