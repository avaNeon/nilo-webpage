/**
 * 用户状态枚举
 */
export const UserStatusEnum = {
  /** 禁用 */
  Disable: 0,
  /** 正常 */
  Enable: 1,
} as const;

/** 用户状态数值类型 */
export type UserStatus =
  (typeof UserStatusEnum)[keyof typeof UserStatusEnum];

/** 状态 → 中文文案 */
const STATUS_LABEL_MAP: Record<UserStatus, string> = {
  [UserStatusEnum.Disable]: "禁用",
  [UserStatusEnum.Enable]: "正常",
};

/** 状态 → CSS 类名 */
const STATUS_CLASS_MAP: Record<UserStatus, string> = {
  [UserStatusEnum.Disable]: "status-disabled",
  [UserStatusEnum.Enable]: "status-enabled",
};

/**
 * 根据用户状态值获取中文文案
 * @param status 用户状态数值
 * @returns 中文描述，未知状态返回 "未知"
 */
export function getUserStatusLabel(status: number): string {
  return STATUS_LABEL_MAP[status as UserStatus] ?? "未知";
}

/**
 * 根据用户状态值获取对应的 CSS 类名
 * @param status 用户状态数值
 * @returns CSS 类名，未知状态返回空字符串
 */
export function getUserStatusClass(status: number): string {
  return STATUS_CLASS_MAP[status as UserStatus] ?? "";
}
