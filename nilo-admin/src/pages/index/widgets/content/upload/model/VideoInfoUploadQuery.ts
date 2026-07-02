/** 后台视频列表查询参数 */
export interface VideoInfoUploadQuery {
  /** 页号（从1开始） */
  pageNo: number;

  /** 页大小 */
  pageSize?: number;

  /** 排除的状态 */
  exclusiveStatusList?: number[];

  /** 视频ID */
  videoId?: string;

  /** 视频名称模糊查询 */
  videoNameFuzzy?: string;

  /** 用户ID */
  userId?: string;

  /** 创建时间起始日期 */
  createTimeStart?: string;

  /** 创建时间截止日期（不包含） */
  createTimeEnd?: string;

  /** 最后更新时间起始日期 */
  lastUpdateTimeStart?: string;

  /** 最后更新时间截止日期（不包含） */
  lastUpdateTimeEnd?: string;

  /** 父级分类ID */
  pCategoryId?: number;

  /** 分类ID */
  categoryId?: number;

  /** 0:转码中 1:转码失败 2:待审核 3:审核成功 4:审核失败 */
  status?: number;

  /** 是否推荐0:未推荐 1:已推荐 */
  recommendType?: number;
  
  /** 0:自制作 1:转载 */
  postType?: number;

  /** 标签模糊查询 */
  tagsFuzzy?: string;

  /** 简介模糊查询 */
  introductionFuzzy?: string;

  /** 互动设置 */
  interaction?: string;
}
