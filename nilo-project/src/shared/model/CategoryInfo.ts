/**
 * 分类信息 TypeScript 接口
 */
export interface CategoryInfo {
    /** 分类编码，业务主键，有语义，方便在未来的场景标识数据唯一性 */
    categoryNumber: string;

    /** 分类名称 */
    categoryName: string;

    /** 图标 */
    icon?: string;

    /** 背景图 */
    background?: string;

    /** 排序序号 */
    sort?: number;

    /** 子分类 */
    children?: CategoryInfo[];
}
