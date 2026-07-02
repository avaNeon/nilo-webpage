/**
 * 用户性别枚举
 */
export const UserGenderEnum = {
  /** 男 */
  Male: 0,
  /** 女 */
  Female: 1,
  /** 未知 */
  Unknown: 2,
} as const;

/** 用户性别数值类型 */
export type UserGender =
  (typeof UserGenderEnum)[keyof typeof UserGenderEnum];

/** 性别 → 中文文案 */
const GENDER_LABEL_MAP: Record<UserGender, string> = {
  [UserGenderEnum.Male]: "男",
  [UserGenderEnum.Female]: "女",
  [UserGenderEnum.Unknown]: "未知",
};

/**
 * 根据用户性别值获取中文文案
 * @param gender 用户性别数值
 * @returns 中文描述，未知性别返回 "未知"
 */
export function getUserGenderLabel(gender: number): string {
  return GENDER_LABEL_MAP[gender as UserGender] ?? "未知";
}
