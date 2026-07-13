import { Api, getWebBaseUrl } from "@/shared/config/Api";
import { publicHlsMasterUrl } from "@/shared/config/Minio";
import { type Danmaku } from "@/shared/model/Danmaku";
import request from "@/shared/lib/request";

/** 发送弹幕 */
async function postDanmaku(danmaku: Danmaku): Promise<boolean | null> {
  const result = await request({
    method: "post",
    url: Api.postDanmaku,
    data: danmaku,
  });
  if (!result) {
    return null;
  }
  return true;
}

/**
 * 按视频时间轴增量加载弹幕。
 * 区间为左闭右开 [fromMs, toMs)，单次跨度不得超过 5000 毫秒。
 */
async function loadDanmakuList(
  videoId: string,
  fileIndex: number,
  fromMs: number,
  toMs: number,
): Promise<Danmaku[] | null> {
  const result = await request({
    method: "get",
    url: `${Api.loadDanmaku}/${videoId}`,
    params: {
      fileIndex,
      fromMs,
      toMs,
    },
  });
  if (!result) {
    return null;
  }
  return result.data;
}

/** VideoDetail：固定 public/{filePath}/master.m3u8 */
function getPublicVideoResource(filePath: string): string {
  return publicHlsMasterUrl(filePath);
}

/** 创作中心未发布预览：鉴权 web HLS（pending） */
function getPendingVideoResource(videoId: string, index: number): string {
  return `${getWebBaseUrl()}${Api.hlsMasterPlaylist}/${videoId}/${index}/master.m3u8`;
}

/** 上报播放统计 */
async function reportPlayCount(videoId: string): Promise<void> {
  await request({
    method: "post",
    url: Api.playCount + `/${videoId}`,
  });
}

export {
  getPublicVideoResource,
  getPendingVideoResource,
  loadDanmakuList,
  postDanmaku,
  reportPlayCount,
};
