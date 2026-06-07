/**
 * 分页计算器
 */
export interface PageCalculator {
  /** 查询/计算结果总数 */
  countTotal: number;

  /** 总页数 */
  pageTotal: number;
}
