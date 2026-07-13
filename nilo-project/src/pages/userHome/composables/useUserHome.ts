import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { UserHomeApi } from "@/pages/userHome/api/UserHomeApi";
import { useHostUserDetailStore } from "@/shared/store/HostUserDetailStore";
import { useLoginStateStore } from "@/shared/store/LoginStateStore";
import { FollowApi } from "@/shared/api/FollowApi";
import message from "@/shared/lib/message";
import { setPageTitle } from "@/shared/utils/PageTitle";
import type { NavItem } from "../model/NavItem";
import { useUserHomeShared } from "../shared/composables/useUserHomeShared";

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

  // 页面加载状态：初始为 true，loadUserDetail 完成后置 false
  const loading = ref(true);

  // 用户不存在状态
  const notFound = ref(false);

  /** 当前后端存储的壁纸序号 */
  const currentThemeIndex = computed(
    () => hostUserDetailStore.userHostDetail?.theme ?? 1,
  );

  /** 预览壁纸序号，null 表示无预览，使用后端主题 */
  const previewIndex = ref<number | null>(null);

  /** 根据 theme 值选择对应的背景图片 */
  const bgStyle = computed(() => {
    const theme = previewIndex.value ?? currentThemeIndex.value;
    const url = bgImageMap[theme];
    return url ? { backgroundImage: `url(${url})` } : {};
  });

  /** 预览壁纸：index 为 null 时清除预览 */
  function setPreviewWallpaper(index: number | null) {
    previewIndex.value = index;
  }

  const activeRouteName = computed(() => route.name as string);

  /** 搜索关键词（与 route.query.keyword 双向同步） */
  const keyword = ref((route.query.keyword as string) || "");

  /** 是否展示用户信息编辑页面 */
  const showEditor = ref(false);

  const showBgImgEditor = ref(false);

  const hideUi = ref(false);

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

  async function loadUserDetail() {
    const hostUserId = route.params.userId as string;
    if (!hostUserId) return;

    const detail = await UserHomeApi.getUserDetail(hostUserId, {
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
    bgStyle,
    navItems,
    activeRouteName,
    keyword,
    showEditor,
    showBgImgEditor,
    currentThemeIndex,
    loading,
    notFound,
    setPreviewWallpaper,
    searchVideos,
    subscribe,
    unsubscribe,
    navigateTo,
    viewFollowing,
    viewFollower,
    reloadUserInfo,
  };
}
