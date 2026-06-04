/**
 * 用户信息更新请求体
 */
export interface UpdatedUserInfo {
  /** 昵称，1-20字 */
  nickName: string;

  /** 头像URL，1-255字 */
  avatar: string;

  /**
   * 性别
   * 0：女
   * 1：男
   * 2：未知
   */
  gender: number;

  /** 生日，格式：yyyy-MM-dd，长度10 */
  birthday: string;

  /** 学校，1-150字 */
  school: string;

  /** 个人简介，1-200字 */
  personalIntroduction: string;

  /** 公告信息，1-300字 */
  noticeInfo: string;
}
