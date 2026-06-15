/**
 * 菜单项定义
 */
export interface MenuItem {
  /** 唯一标识（同时也是路由 name） */
  index: string;
  /** Element Plus 图标组件 */
  icon?: object;
  /** 显示文字 */
  label: string;
  /** 子菜单项 */
  subItems?: MenuItem[];
}
