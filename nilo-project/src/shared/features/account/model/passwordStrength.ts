export const STRENGTH_LABELS = ["", "弱", "一般", "较强", "很强"] as const;

/**
 * 密码强度 0-4：
 * 长度 ≥ 8、字母数字混合、大小写混合、含符号，各算一档；长度不够直接算最弱。
 */
export function passwordStrength(password: string): 0 | 1 | 2 | 3 | 4 {
  if (!password) return 0;
  const passed = [
    password.length >= 8,
    /\d/.test(password) && /[a-zA-Z]/.test(password),
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /[^\w]/.test(password),
  ].filter(Boolean).length;
  return Math.max(1, password.length < 8 ? 1 : passed) as 1 | 2 | 3 | 4;
}
