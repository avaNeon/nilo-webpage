export interface UserVideoAction {
    /** 1: 视频点赞  2: 视频收藏  3: 视频投币 */
    actionType: number
    /** 投币数量 */
    coinAmount: number
}
