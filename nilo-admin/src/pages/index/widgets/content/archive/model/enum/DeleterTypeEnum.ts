/**
 * 删除者类型枚举
 */
export const DeleterTypeEnum = {
  /** 用户自行删除 */
  User: 0,
  /** 管理员删除 */
  Admin: 1,
} as const;

/** 删除者类型数值 */
export type DeleterType =
  (typeof DeleterTypeEnum)[keyof typeof DeleterTypeEnum];

const DELETER_TYPE_LABEL_MAP: Record<DeleterType, string> = {
  [DeleterTypeEnum.User]: "用户",
  [DeleterTypeEnum.Admin]: "管理员",
};

const DELETER_TYPE_CLASS_MAP: Record<DeleterType, string> = {
  [DeleterTypeEnum.User]: "deleter-user",
  [DeleterTypeEnum.Admin]: "deleter-admin",
};

/**
 * 根据删除者类型值获取中文文案
 */
export function getDeleterTypeLabel(type: number): string {
  return DELETER_TYPE_LABEL_MAP[type as DeleterType] ?? "未知";
}

/**
 * 根据删除者类型值获取对应的 CSS 类名
 */
export function getDeleterTypeClass(type: number): string {
  return DELETER_TYPE_CLASS_MAP[type as DeleterType] ?? "";
}
