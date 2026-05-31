import { Api } from "@/shared/config/Api";
import request from "@/shared/lib/request";

/**
 * send heartbeat to server
 * so that server can know the player is still alive, and can update the online count of the video
 * @param videoId videoId
 * @param fileIndex index of file
 * @param sessionId optional UUID session id
 */
function sendHeartbeat(videoId: string, fileIndex: number, sessionId: string): void {
    request({
        method: 'post',
        url: Api.sendHearbeat,
        params: {
            videoId,
            fileIndex,
            sessionId,
        }
    })
}
/**
 * get online watcher count of a video
 * @param videoId video id
 * @param fileIndex index of file
 * @returns online watcher count
 */
async function getOnlineCount(videoId: string, fileIndex: number): Promise<string | null> {
    let result = await request({
        method: 'get',
        url: Api.getOnlineCount,
        params: {
            videoId,
            fileIndex,
        }
    })
    if (!result) {
        return null
    }
    return result.data
}

export { sendHeartbeat, getOnlineCount }