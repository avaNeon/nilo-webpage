import { Api } from "@/shared/config/Api"
import request from "@/shared/lib/request"
import type { UserVideoAction } from "@/features/videoAction/model/UserVideoAction"

/**
 * Perform a video action (like, coin, favorite) for the current user.
 * @param videoId target video id
 * @param actionType 1: like  2: favorite  3: coin
 * @param coinAmount coin amount (1 or 2, only required when actionType is 3)
 */
async function videoAction(videoId: string, actionType: number, coinAmount?: number, errorCallback?: (data: any) => void) {
    return await request({
        method: 'post',
        url: Api.userVideoAction,
        params: {
            videoId,
            actionType,
            ...(coinAmount !== undefined ? { coinAmount } : {}),
        },
        errorCallback
    })
}

/**
 * Get the current user's action status for a video.
 * @param videoId target video id
 * @returns list of UserVideoAction records
 */
async function getVideoAction(videoId: string): Promise<UserVideoAction[] | null> {
    const result = await request({
        method: 'get',
        url: Api.userVideoAction,
        params: { videoId },
    })
    if (!result) {
        return null
    }
    return result.data
}

export { videoAction, getVideoAction }
