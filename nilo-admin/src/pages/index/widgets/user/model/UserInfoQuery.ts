/** 用户账户列表查询参数（对应后端 UserInfoQuery） */
export interface UserInfoQuery {
  /** 页号（后端从 0 开始） */
  pageNo: number;

  /** 页大小（1-100） */
  pageSize: number;

  /** 用户ID */
  userId?: string;

  /** 昵称 */
  nickName?: string;

  /** 昵称模糊查询 */
  nickNameFuzzy?: string;

  /** 邮箱 */
  email?: string;

  /** 邮箱模糊查询 */
  emailFuzzy?: string;

  /** 密码 */
  password?: string;

  /** 密码模糊查询 */
  passwordFuzzy?: string;

  /** 0:男 1:女 2:未知 */
  gender?: number;

  /** 出生日期 */
  birthday?: string;

  /** 出生日期模糊查询 */
  birthdayFuzzy?: string;

  /** 学校 */
  school?: string;

  /** 学校模糊查询 */
  schoolFuzzy?: string;

  /** 个人简介 */
  personalIntroduction?: string;

  /** 个人简介模糊查询 */
  personalIntroductionFuzzy?: string;

  /** 注册时间 */
  registerTime?: string;

  /** 注册时间起始日期（yyyy-MM-dd） */
  registerTimeStart?: string;

  /** 注册时间截止日期（不包含，yyyy-MM-dd） */
  registerTimeEnd?: string;

  /** 最后登录时间 */
  lastLoginTime?: string;

  /** 最后登录时间起始日期（yyyy-MM-dd） */
  lastLoginTimeStart?: string;

  /** 最后登录时间截止日期（不包含，yyyy-MM-dd） */
  lastLoginTimeEnd?: string;

  /** 最后登录IP */
  lastLoginIp?: string;

  /** 最后登录IP模糊查询 */
  lastLoginIpFuzzy?: string;

  /** 0:禁用 1:正常 */
  status?: number;

  /** 空间公告 */
  noticeInfo?: string;

  /** 空间公告模糊查询 */
  noticeInfoFuzzy?: string;

  /** 硬币总数 */
  totalCoin?: number;

  /** 当前硬币数 */
  currentCoin?: number;

  /** 主题 */
  theme?: number;
}
