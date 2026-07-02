/** 存档视频列表查询参数 */
export interface VideoInfoArchiveQuery {
  /** 页号（从1开始） */
  pageNo: number;

  /** 页大小（1-20） */
  pageSize?: number;

  /** 视频ID */
  videoId?: string;

  /** 视频名称模糊查询 */
  videoNameFuzzy?: string;

  /** 用户ID */
  userId?: string;

  /** 删除者类型 */
  deleterType?: number;

  /** 父级分类ID */
  pCategoryId?: number;

  /** 分类ID */
  categoryId?: number;

  /** 0:自制 1:转载 */
  postType?: number;

  /** 标签模糊查询 */
  tagsFuzzy?: string;

  /** 简介模糊查询 */
  introductionFuzzy?: string;

  /** 互动设置 */
  interaction?: string;
}
