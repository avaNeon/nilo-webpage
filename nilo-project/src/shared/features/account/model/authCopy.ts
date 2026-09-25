/** 面板模式：登录 / 注册 / 忘记密码 */
export type AuthPanelMode = "login" | "register" | "forgot";

/** 左侧品牌区文案 */
export const BRAND_COPY: Record<
  AuthPanelMode,
  { label: string; title: string; sub: string }
> = {
  login: {
    label: "SIGN IN",
    title: "欢迎回来",
    sub: "登录后同步你的收藏、历史与关注。",
  },
  register: {
    label: "SIGN UP",
    title: "点亮你的光点",
    sub: "注册后即可投稿、发弹幕、参与评论。",
  },
  forgot: {
    label: "RESET",
    title: "找回账号",
    sub: "验证邮箱后即可设置新密码。",
  },
};

export interface AuthDoneCopy {
  label: string;
  title: string;
  sub: string;
  button: string;
}

/** 提交成功后右侧的结果页文案 */
export function buildDoneCopy(
  mode: AuthPanelMode,
  maskedEmail: string,
): AuthDoneCopy {
  switch (mode) {
    case "register":
      return {
        label: "WELCOME",
        title: "欢迎加入光点",
        // 注册接口不会返回登录态，所以按钮是回到登录，而不是直接开始浏览
        sub: `账号 ${maskedEmail} 已创建，登录后即可投稿和评论。`,
        button: "去登录",
      };
    case "forgot":
      return {
        label: "DONE",
        title: "密码已重置",
        sub: "请使用新密码重新登录。",
        button: "返回登录",
      };
    default:
      return {
        label: "SIGNED IN",
        title: "登录成功",
        sub: "正在为你同步收藏、历史与关注。",
        button: "开始浏览",
      };
  }
}

/** 邮箱打码：ab***@example.com */
export function maskEmail(email: string): string {
  const [user = "", domain = ""] = email.split("@");
  const head = user.length <= 2 ? user.slice(0, 1) + "*" : user.slice(0, 2) + "***";
  return `${head}@${domain}`;
}
