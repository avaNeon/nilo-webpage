import { createRouter, createWebHistory } from "vue-router";
import Index from "@/pages/index/ui/Index.vue";
import RecommendVideo from "@/widgets/recommendVideo/ui/RecommendVideo.vue";
import SubCategoryBanner from "@/widgets/subCategoryBanner/ui/SubCategoryBanner.vue";
import VideoDetail from "@/pages/videoDetail/ui/VideoDetail.vue";
import CreativeCenter from "@/pages/creativeCenter/ui/CreativeCenter.vue";
import CreativeCenterHome from "@/widgets/creativeCenterHome/ui/CreativeCenterHome.vue";
import VideoUploadEdit from "@/features/videoUpload/ui/VideoUploadEdit.vue";

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
      ],
    },
  ],
});

export default router;
