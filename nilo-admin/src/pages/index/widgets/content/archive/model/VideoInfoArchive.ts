/** 存档视频信息（含用户信息） */
export interface VideoInfoArchive {
  /** 视频ID */
  videoId: string;

  /** 视频封面 */
  videoCover: string;

  /** 视频名称 */
  videoName: string;

  /** 用户ID */
  userId: string;

  /** 创建时间 */
  createTime: string;

  /** 最后更新时间 */
  lastUpdateTime: string;

  /** 删除时间 */
  deleteTime: string;

  /** 删除者类型 */
  deleterType: number;

  /** 删除原因 */
  deleteDetail: string;

  /** 父级分类ID */
  pCategoryId: number;

  /** 分类ID */
  categoryId: number;

  /** 0:自制 1:转载 */
  postType: number;

  /** 原资源说明 */
  originInfo: string;

  /** 标签 */
  tags: string;

  /** 简介 */
  introduction: string;

  /** 互动设置 */
  interaction: string;

  /** 持续时间（秒） */
  duration: number;

  /** 播放数量 */
  playCount: number;

  /** 点赞数量 */
  likeCount: number;

  /** 弹幕数量 */
  danmakuCount: number;

  /** 评论数量 */
  commentCount: number;

  /** 投币数量 */
  coinCount: number;

  /** 收藏数量 */
  collectCount: number;

  /** 用户昵称 */
  nickName: string;

  /** 头像路径 */
  avatar: string;
}
