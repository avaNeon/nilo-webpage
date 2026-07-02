import Index from "@/pages/index/Index.vue";
import CategoryManagement from "@/pages/index/widgets/content/category/ui/CategoryManagement.vue";
import UploadManagement from "@/pages/index/widgets/content/upload/ui/UploadManagement.vue";
import ArchiveManagement from "@/pages/index/widgets/content/archive/ui/ArchiveManagement.vue";
import Home from "@/pages/index/widgets/home/Home.vue";
import Login from "@/pages/login/Login.vue";
import { createRouter, createWebHistory } from "vue-router";
import CommentManagement from "@/pages/index/widgets/interaction/comment/ui/CommentManagement.vue";
import DanmakuManagement from "@/pages/index/widgets/interaction/danmaku/ui/DanmakuManagement.vue";
import SystemSetting from "@/pages/index/widgets/systemSetting/ui/SystemSetting.vue";
import UserManagement from "@/pages/index/widgets/user/ui/UserManagement.vue";

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
        // 内容管理 - 稿件管理
        {
          path: "upload",
          name: "upload",
          component: UploadManagement,
        },
        // 内容管理 - 存档管理
        {
          path: "archive",
          name: "archive",
          component: ArchiveManagement,
        },
        // 互动管理 - 评论管理
        {
          path: "comment",
          name: "comment",
          component: CommentManagement,
        },
        // 互动管理 - 弹幕管理
        {
          path: "danmaku",
          name: "danmaku",
          component: DanmakuManagement,
        },
        // 用户管理
        {
          path: "user",
          name: "user",
          component: UserManagement,
        },
        // 系统设置
        {
          path: "setting",
          name: "setting",
          component: SystemSetting,
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
