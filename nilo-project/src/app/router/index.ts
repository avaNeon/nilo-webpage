import { createRouter, createWebHistory } from "vue-router";
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
        // default
        {
          path: "",
          component: UserHomeIndex,
        },
      ],
    },
  ],
});

export default router;
