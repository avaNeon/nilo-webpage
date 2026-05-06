import { Api } from "@/shared/config/Api"
import { type Danmaku } from "@/shared/model/Danmaku"
import request from "@/shared/lib/request"

/**
 * Save one danmaku item to backend.
 * @param danmaku danmaku payload
 * @returns backend `data` field when request succeeds
 */
async function postDanmaku(danmaku: Danmaku): Promise<boolean | null> {
    const result = await request({
        method: 'post',
        url: Api.postDanmaku,
        data: danmaku,
    })
    if (!result) {
        return null
    }
    return result.data
}

/**
 * Load danmaku list for one video file.
 * @param videoId video id
 * @param fileIndex file index
 * @returns backend `data` field containing the danmaku list
 */
async function loadDanmakuList(videoId: string, fileIndex: number): Promise<Danmaku[] | null> {
    const result = await request({
        method: 'get',
        url: `${Api.loadDanmaku}/${videoId}`,
        params: {
            fileIndex,
        }
    })
    if (!result) {
        return null
    }
    return result.data
}

/**
 * Get raw m3u8 playlist text for one video file.
 * @param videoId video id
 * @param index file index
 * @returns raw playlist text
 */
async function getVideoResource(videoId: string, index: number): Promise<string | null> {
    const result = await request({
        method: 'get',
        url: `${Api.getVideoResource}/${videoId}`,
        params: {
            index,
        },
        responseType: 'text',
        showLoading: true,
    })
    if (!result || typeof result !== 'string') {
        return null
    }
    return result
}

export { getVideoResource, loadDanmakuList, postDanmaku }