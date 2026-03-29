import { createRouter, createWebHistory } from 'vue-router'
import Facade from '@/pages/Facade.vue'
import index from '@/widgets/videoList/ui/VideoList.vue';

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
                {
                    path: '',
                    component: index
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

