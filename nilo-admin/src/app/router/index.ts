import Index from "@/pages/index/Index.vue";
import Home from "@/pages/index/widgets/home/Home.vue";
import Login from "@/pages/login/Login.vue";
import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // 主页
    {
      path: "/",
      name: "index",
      component: Index,
      redirect: "/home",
      children: [
        {
          path: "home",
          name: "home",
          component: Home,
        },
      ],
    },
    // 登录页
    {
      path: "/login",
      name: "login",
      component: Login,
    },
  ],
});

export default router;
