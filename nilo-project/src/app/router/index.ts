import { createRouter, createWebHistory } from "vue-router";
import { getAutoLoginPromise } from "@/app/composables/useAutoLogin";
import { isPublicRoute } from "@/app/router/publicRoutes";
import { setPageTitle } from "@/shared/utils/PageTitle";
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
          meta: { title: "分类" },
        },
      ],
    },
    /** Video Detail Page */
    {
      path: "/video/:videoId/:index?",
      name: "video",
      component: VideoDetail,
      meta: { title: "视频" },
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
          meta: { title: "创作中心" },
        },
        {
          path: "upload",
          name: "videoUpload",
          component: VideoUploadEdit,
          meta: { title: "投稿" },
        },
        {
          path: "video",
          name: "videoManagement",
          component: VideoManagement,
          meta: { title: "视频管理" },
        },
        {
          path: "danmaku/:videoId?/:fileIndex?",
          name: "danmakuManagement",
          component: DanmakuManagement,
          meta: { title: "弹幕管理" },
        },
        {
          path: "comment/:videoId?",
          name: "videoCommentManagement",
          component: VideoCommentManagement,
          meta: { title: "评论管理" },
        },
      ],
    },
    {
      path: "/user/:userId",
      name: "userHome",
      component: UserHome,
      meta: { title: "用户主页" },
      children: [
        // default - 首页
        {
          path: "",
          name: "userHomeIndex",
          component: UserHomeIndex,
          meta: { title: "用户主页" },
        },
        // 投稿
        {
          path: "upload/:sortType?",
          name: "userUpload",
          component: UserHomeUpload,
          meta: { title: "投稿" },
        },
        // 系列
        {
          path: "series/:seriesId?",
          name: "userVideoSeries",
          component: UserHomeVideoSeries,
          meta: { title: "系列" },
        },
        // 收藏
        {
          path: "collection",
          name: "userCollection",
          component: UserHomeCollection,
          meta: { title: "收藏" },
        },
        // 粉丝列表
        {
          path: "follower",
          name: "userFollowerList",
          component: UserHomeFollowerList,
          meta: { title: "粉丝" },
        },
        // 关注列表
        {
          path: "following",
          name: "userFollowingList",
          component: UserHomeFollowingList,
          meta: { title: "关注" },
        },
      ],
    },
    {
      path: "/history/:userId",
      name: "history",
      component: VideoHistory,
      meta: { title: "历史记录" },
    },
    {
      path: "/message/:type",
      name: "messageCenter",
      component: MessageCenter,
      meta: { title: "消息中心" },
    },
    {
      path: "/popular",
      name: "hot-ranking",
      component: HotRanking,
      meta: { title: "24小时热榜" },
    },
    {
      path: "/search/:keyword?",
      name: "video-search",
      component: VideoSearch,
      meta: { title: "搜索" },
    },
    {
      path: "/unlogged",
      name: "unlogged",
      component: Unlogged,
      meta: { title: "请先登录" },
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

// 根据路由 meta 设置默认标题；动态页会在数据就绪后覆盖
router.afterEach(to => {
  const titleRecord = [...to.matched]
    .reverse()
    .find(record => record.meta.title !== undefined);
  setPageTitle(titleRecord?.meta.title ?? null);
});

export default router;
