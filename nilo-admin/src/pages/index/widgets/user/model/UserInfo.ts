/** 用户账户信息（对应后端 UserInfo PO） */
export interface UserInfo {
  /** 用户ID */
  userId: string;

  /** 昵称 */
  nickName: string;

  /** 头像路径 */
  avatar: string;

  /** 邮箱 */
  email: string;

  /** 密码 */
  password: string;

  /** 0:男 1:女 2:未知 */
  gender: number;

  /** 出生日期 */
  birthday: string;

  /** 学校 */
  school: string;

  /** 个人简介 */
  personalIntroduction: string;

  /** 注册时间 */
  registerTime: string;

  /** 最后登录时间 */
  lastLoginTime: string;

  /** 最后登录IP */
  lastLoginIp: string;

  /** 0:禁用 1:正常 */
  status: number;

  /** 空间公告 */
  noticeInfo: string;

  /** 硬币总数 */
  totalCoin: number;

  /** 当前硬币数 */
  currentCoin: number;

  /** 主题 */
  theme: number;
}
