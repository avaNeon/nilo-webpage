import type { VideoInfo } from "@/shared/model/VideoInfo"

/**
 * 包含分页结果的视频列表
 */
export interface VideoList {
    totalCount: number
    pageSize: number
    /**
     * 分页号从1开始
     */
    pageNo: number
    pageTotal: number
    list: Array<VideoInfo>
}