import { createRouter, createWebHistory } from 'vue-router'
import Facade from "../pages/Facade.vue"
import index from '../components/Facade/index/index.vue';

const router = createRouter({
    history: createWebHistory(),
    routes: [
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
        {
            path: "/",
            redirect: "/facade"
        }
    ]
})

export default router;