import type { BaseQuery } from "@/pages/index/widgets/content/category/model/BaseQuery";

/**
 * 分类信息分页查询参数
 */
export interface CategoryInfoQuery extends BaseQuery {
    /** 自增分类 ID */
    categoryId?: number;

    /** 分类编码（精确匹配） */
    categoryNumber?: string;

    /** 分类编码（模糊匹配） */
    categoryNumberFuzzy?: string;

    /** 分类名称（精确匹配） */
    categoryName?: string;

    /** 分类名称（模糊匹配） */
    categoryNameFuzzy?: string;

    /** 父级分类 ID */
    pCategoryId?: number;

    /** 图标（精确匹配） */
    icon?: string;

    /** 图标（模糊匹配） */
    iconFuzzy?: string;

    /** 背景图（精确匹配） */
    background?: string;

    /** 背景图（模糊匹配） */
    backgroundFuzzy?: string;

    /** 主题色（精确匹配） */
    color?: string;

    /** 主题色（模糊匹配） */
    colorFuzzy?: string;

    /** 排序号 */
    sort?: number;
}