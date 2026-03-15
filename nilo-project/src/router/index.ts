import { createRouter, createWebHistory } from 'vue-router'
import Facade from "../pages/Facade.vue"

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: "/facade",
            name: "facade",
            component: Facade
        },
        {
            path: "/",
            redirect: "/facade"
        }
    ]
})

export default router;