/**
 * 通用分页查询基类
 */
export interface BaseQuery {
    /** 页号（从 1 开始），默认 1 */
    pageNo?: number;

    /** 每页条数，默认 20 */
    pageSize?: number;

    /** 排序字段及方向，如 "sort asc" */
    orderBy?: string;
}