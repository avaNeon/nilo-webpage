import { createRouter, createWebHistory } from "vue-router";
import { getAutoLoginPromise } from "@/app/composables/useAutoLogin";
import { isPublicRoute } from "@/app/router/publicRoutes";
import Index from "@/pages/index/ui/Index.vue";
import RecommendVideo from "@/pages/index/widgets/recommendVideo/ui/RecommendVideo.vue";
import SubCategoryBanner from "@/pages/index/widgets/subCategoryBanner/ui/SubCategoryBanner.vue";
import VideoDetail from "@/pages/videoDetail/ui/VideoDetail.vue";
import CreativeCenter from "@/pages/creativeCenter/ui/CreativeCenter.vue";
import CreativeCenterHome from "@/pages/creativeCenter/widgets/creativeCenterHome/ui/CreativeCenterHome.vue";
import VideoUploadEdit from "@/pages/creativeCenter/features/videoUpload/ui/VideoUploadEdit.vue";
import VideoManagement from "@/pages/creativeCenter/widgets/VideoManagement/ui/VideoManagement.vue";
import DanmakuManagement from "@/pages/creativeCenter/widgets/DanmakuManagement/ui/DanmakuManagement.vue";
import VideoCommentManagement from "@/pages/creativeCenter/widgets/VideoCommentManagement/ui/VideoCommentManagement.vue";
import UserHome from "@/pages/userHome/ui/UserHome.vue";
import UserHomeIndex from "@/pages/userHome/widgets/userHomeIndex/ui/UserHomeIndex.vue";
import UserHomeUpload from "@/pages/userHome/widgets/userHomeUpload/ui/UserHomeUpload.vue";
import UserHomeVideoSeries from "@/pages/userHome/widgets/userHomeVideoSeries/ui/UserHomeVideoSeries.vue";
import UserHomeCollection from "@/pages/userHome/widgets/userHomeCollection/ui/UserHomeCollection.vue";
import UserHomeFollowerList from "@/pages/userHome/widgets/userHomeFollowerList/ui/UserHomeFollowerList.vue";
import UserHomeFollowingList from "@/pages/userHome/widgets/userHomeFollowingList/ui/UserHomeFollowingList.vue";
import VideoHistory from "@/pages/videoHistory/ui/VideoHistory.vue";
import MessageCenter from "@/pages/messageCenter/ui/MessageCenter.vue";
import HotRanking from "@/pages/hotRanking/ui/HotRanking.vue";
import VideoSearch from "@/pages/videoSearch/ui/VideoSearch.vue";
import Unlogged from "@/pages/unlogged/ui/Unlogged.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    /** Index Page */
    {
      path: "/",
      name: "index",
      component: Index,
      children: [
        // default
        {
          path: "",
          component: RecommendVideo,
        },
        // 分类页
        {
          path: "c/:categoryNumber?/:subCategoryNumber?",
          name: "category",
          component: SubCategoryBanner,
        },
      ],
    },
    /** Video Detail Page */
    {
      path: "/video/:videoId/:index?",
      name: "video",
      component: VideoDetail,
    },
    /** Creative Center Page */
    {
      path: "/cc",
      name: "creativeCenter",
      redirect: "/cc/home",
      component: CreativeCenter,
      children: [
        {
          path: "home",
          name: "ccIndexPage",
          component: CreativeCenterHome,
        },
        {
          path: "upload",
          name: "videoUpload",
          component: VideoUploadEdit,
        },
        {
          path: "video",
          name: "videoManagement",
          component: VideoManagement,
        },
        {
          path: "danmaku/:videoId?/:fileIndex?",
          name: "danmakuManagement",
          component: DanmakuManagement,
        },
        {
          path: "comment/:videoId?",
          name: "videoCommentManagement",
          component: VideoCommentManagement,
        },
      ],
    },
    {
      path: "/user/:userId",
      name: "userHome",
      component: UserHome,
      children: [
        // default - 首页
        {
          path: "",
          name: "userHomeIndex",
          component: UserHomeIndex,
        },
        // 投稿
        {
          path: "upload/:sortType?",
          name: "userUpload",
          component: UserHomeUpload,
        },
        // 系列
        {
          path: "series/:seriesId?",
          name: "userVideoSeries",
          component: UserHomeVideoSeries,
        },
        // 收藏
        {
          path: "collection",
          name: "userCollection",
          component: UserHomeCollection,
        },
        // 粉丝列表
        {
          path: "follower",
          name: "userFollowerList",
          component: UserHomeFollowerList,
        },
        // 关注列表
        {
          path: "following",
          name: "userFollowingList",
          component: UserHomeFollowingList,
        },
      ],
    },
    {
      path: "/history/:userId",
      name: "history",
      component: VideoHistory,
    },
    {
      path: "/message/:type",
      name: "messageCenter",
      component: MessageCenter,
    },
    {
      path: "/popular",
      name: "hot-ranking",
      component: HotRanking,
    },
    {
      path: "/search/:keyword?",
      name: "video-search",
      component: VideoSearch,
    },
    {
      path: "/unlogged",
      name: "unlogged",
      component: Unlogged,
    },
  ],
});

// 在路由守卫中进行自动登录检查，如果没有登录且访问的不是公开路由，则重定向到未登录页面
router.beforeEach(async (to, _from, next) => {
  const loggedIn = await getAutoLoginPromise();
  if (!loggedIn && !isPublicRoute(to)) {
    next({ name: "unlogged", replace: true });
    return;
  }
  next();
});

export default router;
