import type { BriefUserInfo } from "@/shared/model/BriefUserInfo";

/**
 * 关注用户信息
 *
 * - followed:  在粉丝列表中使用 — 我是否回关了这个粉丝
 * - following: 在关注列表中使用 — 我关注的这个人是否回关了我
 */
export interface FollowUserInfo extends BriefUserInfo {
  followed?: boolean;
  following?: boolean;
}
