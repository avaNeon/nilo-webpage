/**
 * 分页响应结果
 */
export interface PaginationResponse<T> {
  totalCount: number | null;
  pageSize: number | null;
  /** 分页号从1开始 */
  pageNo: number | null;
  pageTotal: number | null;
  list: T[] | null;
}
