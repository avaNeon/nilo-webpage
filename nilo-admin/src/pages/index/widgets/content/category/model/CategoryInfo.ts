/**
 * 分类信息
 */
export interface CategoryInfo {
    /** 自增分类 ID */
    categoryId?: number;

    /** 分类编码（业务主键，有语义） */
    categoryNumber: string;

    /** 分类名称 */
    categoryName: string;

    /** 父级分类 ID */
    pCategoryId: number;

    /** 图标 */
    icon?: string;

    /** 背景图 */
    background?: string;

    /** 主题色 */
    color?: string;

    /** 排序序号 */
    sort?: number;

    /** 子分类列表 */
    children?: CategoryInfo[];
}