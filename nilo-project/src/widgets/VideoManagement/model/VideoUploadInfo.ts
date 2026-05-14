/**
 * 用户上传视频信息（含关联数据）
 */
export interface VideoUploadInfo {
  /** 视频ID */
  videoId: string | null;

  /** 视频封面 */
  videoCover: string | null;

  /** 视频名称 */
  videoName: string | null;

  /** 用户ID */
  userId: number | null;

  /** 创建时间 */
  createTime: string | null;

  /** 最后更新时间 */
  lastUpdateTime: string | null;

  /** 父级分类ID（视频所属为一级分类时为null） */
  parentCategoryNumber: string | null;

  /** 分类ID */
  categoryNumber: string | null;

  /** 0:转码中 1:转码失败 2:待审核 3:审核成功 4:审核失败 */
  status: 0 | 1 | 2 | 3 | 4 | null;

  /** 0:自制作 1:转载 */
  postType: number | null;

  /** 原资源说明 */
  originInfo: string | null;

  /** 标签 */
  tags: string | null;

  /** 简介 */
  introduction: string | null;

  /** 互动设置 */
  interaction: string | null;

  /** 持续时间（秒） */
  duration: number | null;

  /** 播放数量 */
  playCount: number | null;

  /** 点赞数量 */
  likeCount: number | null;

  /** 弹幕数量 */
  danmakuCount: number | null;

  /** 评论数量 */
  commentCount: number | null;

  /** 投币数量 */
  coinCount: number | null;

  /** 收藏数量 */
  collectCount: number | null;

  /** 是否推荐 0:未推荐 1:已推荐 */
  recommendType: number | null;
}
