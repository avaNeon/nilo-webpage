/**
 * 用户主页详情
 */
export interface UserDetail {
  /** 用户ID */
  userId: string | null;

  /** 用户昵称 */
  nickName: string | null;

  /** 头像URL */
  avatar: string | null;

  /** 性别：0-未知 1-男 2-女 */
  gender: number | null;

  /** 生日 */
  birthday: string | null;

  /** 学校 */
  school: string | null;

  /** 个人简介 */
  personalIntroduction: string | null;

  /** 状态 */
  status: number | null;

  /** 公告信息 */
  noticeInfo: string | null;

  /** 主题 */
  theme: number | null;

  /** 当前硬币数 */
  currentCoin: number;

  /** 粉丝数 */
  followerCount: number;

  /** 关注数 */
  followingCount: number;

  /** 是否已关注 */
  hasFollowed: boolean;
}
