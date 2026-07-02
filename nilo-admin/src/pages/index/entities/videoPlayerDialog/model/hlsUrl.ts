import { ADMIN_SERVICE_PREFIX, Api } from "@/shared/config/Api";

/**
 * 构建 HLS master.m3u8 播放地址（普通视频）
 * @param videoId 视频ID
 * @param index   分P索引（从1开始）
 */
export function getHlsMasterUrl(videoId: string, index: number = 1): string {
  return `${ADMIN_SERVICE_PREFIX}${Api.hlsMaster}/${videoId}/${index}/master.m3u8`;
}

/**
 * 构建存档 HLS master.m3u8 播放地址
 * @param videoId 视频ID
 * @param index   分P索引（从1开始）
 */
export function getArchiveHlsMasterUrl(videoId: string, index: number = 1): string {
  return `${ADMIN_SERVICE_PREFIX}${Api.archiveHlsMaster}/${videoId}/${index}/master.m3u8`;
}

/**
 * 构建存档 HLS 分辨率播放列表地址（playlist.m3u8）
 * @param videoId    视频ID
 * @param index      分P索引（从1开始）
 * @param resolution 分辨率（高度像素值，如 720, 1080）
 */
export function getArchiveHlsPlaylistUrl(videoId: string, index: number, resolution: number): string {
  return `${ADMIN_SERVICE_PREFIX}${Api.archiveHlsPlaylist}/${videoId}/${index}/playlist/${resolution}.m3u8`;
}

/**
 * 构建存档 HLS 分片地址（segment.ts）
 * @param videoId    视频ID
 * @param index      分P索引（从1开始）
 * @param resolution 分辨率（高度像素值）
 * @param segment    分片文件名
 */
export function getArchiveHlsSegmentUrl(videoId: string, index: number, resolution: number, segment: string): string {
  return `${ADMIN_SERVICE_PREFIX}${Api.archiveHlsSegment}/${videoId}/${index}/segment/${resolution}/${segment}`;
}
