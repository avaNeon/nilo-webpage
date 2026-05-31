/**
 * login info
 * it's compatible with both register & login info
 */
export interface LoginInfo {
  email: string;
  nickName: string;
  password: string;
  code: string;
  captchaKey: string;
}
