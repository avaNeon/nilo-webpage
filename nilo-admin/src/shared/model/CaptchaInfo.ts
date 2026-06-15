/**
 * 验证码信息
 */
export interface CaptchaInfo {
    /** 验证码图片 Base64 字符串 */
    captchaImg: string;
    /** 验证码 Key，登录时需要回传 */
    captchaKey: string;
}
