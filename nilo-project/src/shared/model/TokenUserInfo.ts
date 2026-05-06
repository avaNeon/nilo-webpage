import type { BriefUserInfo } from './BriefUserInfo'

/**
 * user info returned by token-based API calls, such as auto-login
 */
export interface TokenUserInfo {
    userInfo: BriefUserInfo
    followerCount: number
    followingCount: number
    currentCoin: number
}
