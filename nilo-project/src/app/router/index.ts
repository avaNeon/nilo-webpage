import { createRouter, createWebHistory } from 'vue-router'
import Facade from '@/pages/ui/Facade.vue'
import RecommendVideo from '@/widgets/recommendVideo/ui/RecommendVideo.vue';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        /**
         * 主页
         */
        {
            path: "/facade/:categoryNumber?/:subCategoryNumber?",
            name: "facade",
            component: Facade,
            children: [
                // default
                {
                    path: '',
                    component: RecommendVideo
                }
            ]
        },
        /**
         * 还是主页
         */
        {
            path: "/",
            redirect: "/facade"
        }
    ]
})

export default router;

