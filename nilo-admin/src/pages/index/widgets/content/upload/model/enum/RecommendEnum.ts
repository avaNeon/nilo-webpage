/**
 * 推荐状态枚举
 */
export const RecommendEnum = {
  /** 未推荐 */
  NotRecommended: 0,
  /** 已推荐 */
  Recommended: 1,
} as const;

/** 推荐状态数值类型 */
export type RecommendType = (typeof RecommendEnum)[keyof typeof RecommendEnum];

/** 推荐 → 中文文案 */
const RECOMMEND_LABEL_MAP: Record<RecommendType, string> = {
  [RecommendEnum.Recommended]: "已推荐",
  [RecommendEnum.NotRecommended]: "未推荐",
};

/** 推荐 → CSS 类名 */
const RECOMMEND_CLASS_MAP: Record<RecommendType, string> = {
  [RecommendEnum.Recommended]: "recommend-yes",
  [RecommendEnum.NotRecommended]: "recommend-no",
};

/**
 * 根据推荐状态值获取中文文案
 * @param type 推荐状态数值
 * @returns "已推荐" | "未推荐"
 */
export function getRecommendLabel(type: number): string {
  return RECOMMEND_LABEL_MAP[type as RecommendType] ?? "未推荐";
}

/**
 * 根据推荐状态值获取对应的 CSS 类名
 * @param type 推荐状态数值
 * @returns CSS 类名
 */
export function getRecommendClass(type: number): string {
  return RECOMMEND_CLASS_MAP[type as RecommendType] ?? "recommend-no";
}
