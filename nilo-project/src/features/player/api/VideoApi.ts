import { Api, getWebBaseUrl } from "@/shared/config/Api"
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
 * Get the absolute URL of the HLS master playlist (master.m3u8) for a video file.
 * Hls.js will use this URL to discover variant streams and TS segments natively.
 * @param videoId video id
 * @param index file index
 * @returns absolute URL to the master playlist
 */
function getVideoResource(videoId: string, index: number): string {
    const baseUrl = getWebBaseUrl();
    return `${baseUrl}${Api.hlsMasterPlaylist}/${videoId}/${index}/master.m3u8`;
}

export { getVideoResource, loadDanmakuList, postDanmaku }