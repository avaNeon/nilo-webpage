/**
 * 管理员登录成功后返回的 Token 信息
 */
export interface TokenAdmin {
  /** 管理员级别 */
  level: number;
  /** 管理员账号名 */
  account: string;
  /** Token 过期时间戳 */
  expireTime: number;
  /** Token 字符串 */
  token: string;
}
