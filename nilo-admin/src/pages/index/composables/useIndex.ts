import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  HomeFilled,
  Monitor,
  Setting,
  UserFilled,
  Collection,
  Document,
  ChatDotSquare,
  ChatLineSquare,
} from "@element-plus/icons-vue";
import type { MenuItem } from "@/pages/index/model/MenuItem";

export function useIndex() {
  const route = useRoute();
  const router = useRouter();

  // 当前选中的菜单项
  const activeMenu = ref("");

  // 菜单项定义
  const menuItems: MenuItem[] = [
    { index: "home", icon: HomeFilled, label: "首页概览" },
    {
      index: "content",
      icon: Monitor,
      label: "内容管理",
      subItems: [
        { index: "category", icon: Collection, label: "分类管理" },
        { index: "upload", icon: Document, label: "稿件管理" },
      ],
    },
    {
      index: "interaction",
      icon: ChatDotSquare,
      label: "互动管理",
      subItems: [
        { index: "comment", icon: ChatLineSquare, label: "评论管理" },
        { index: "danmaku", icon: ChatLineSquare, label: "弹幕管理" },
      ],
    },
    { index: "users", icon: UserFilled, label: "用户管理" },
    { index: "settings", icon: Setting, label: "系统设置" },
  ];

  // 菜单点击切换路由
  function onMenuSelect(index: string) {
    activeMenu.value = index;
    if (index === "home") {
      router.push({ name: "home" });
    }
    // 其他菜单项路由后续添加
  }

  // 路由切换时同步菜单选中状态
  watch(
    () => route.name,
    name => {
      if (name && typeof name === "string") {
        activeMenu.value = name;
      }
    },
    { immediate: true },
  );

  // 仅有子菜单项的 index 列表，提供给 el-menu 的 default-openeds 来默认展开
  const defaultOpeneds = menuItems
    .filter(item => item.subItems)
    .map(item => item.index);

  return {
    activeMenu,
    menuItems,
    defaultOpeneds,
    onMenuSelect,
  };
}
