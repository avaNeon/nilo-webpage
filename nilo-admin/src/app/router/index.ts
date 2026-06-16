import Index from "@/pages/index/Index.vue";
import CategoryManagement from "@/pages/index/widgets/content/category/ui/CategoryManagement.vue";
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
        // 首页概览
        {
          path: "home",
          name: "home",
          component: Home,
        },
        // 内容管理 - 分类管理
        {
          path: "category",
          name: "category",
          component: CategoryManagement,
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
