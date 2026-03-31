import { createRouter, createWebHistory } from 'vue-router'
import Index from '@/pages/index/ui/Index.vue'
import RecommendVideo from '@/widgets/recommendVideo/ui/RecommendVideo.vue';

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
                    component: RecommendVideo
                }
            ]
        },
    ]
})

export default router;

