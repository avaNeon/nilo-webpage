import { createRouter, createWebHistory } from 'vue-router'
import Index from '@/pages/index/ui/Index.vue'
import RecommendVideo from '@/widgets/recommendVideo/ui/RecommendVideo.vue';
import SubCategoryBanner from '@/widgets/subCategoryBanner/ui/SubCategoryBanner.vue';
import VideoDetail from '@/pages/videoDetail/ui/VideoDetail.vue';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        /**
         * 主页
         */
        {
            path: "/",
            name: "index",
            component: Index,
            children: [
                // default
                {
                    path: '',
                    component: RecommendVideo
                },
                // 分类页
                {
                    path: "c/:categoryNumber?/:subCategoryNumber?",
                    name: "category",
                    component: SubCategoryBanner
                }
            ]
        },
        /** 视频详情页 */
        {
            path: "/video/:videoId",
            name: "video",
            component: VideoDetail
        }
    ]
})

export default router;

