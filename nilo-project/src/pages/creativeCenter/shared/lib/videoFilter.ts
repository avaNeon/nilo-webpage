/**
 * 稿件管理 → 评论管理 / 弹幕管理「仅看此视频」：
 * 路由参数只带 videoId，标题和封面放在 history.state 里带过去，筛选胶囊直接能显示；
 * 刷新页面后 state 还在（同一条历史记录），直接打开链接时没有，页面自己从列表数据里兜底。
 */

// 用 type 而不是 interface：这样才能直接赋给 vue-router 的 HistoryState（它要求有索引签名）
export type VideoFilterInfo = {
  videoName: string | null;
  videoCover: string | null;
};

const STATE_KEY = "ccVideoFilter";

/** 生成 router.push 的 state：router.push({ name, params: { videoId }, state: videoFilterState(video) }) */
export function videoFilterState(info: VideoFilterInfo): Record<string, VideoFilterInfo> {
  return {
    [STATE_KEY]: {
      videoName: info.videoName ?? null,
      videoCover: info.videoCover ?? null,
    },
  };
}

/** 读当前历史记录里带过来的视频信息，没有就返回 null */
export function readVideoFilterState(): VideoFilterInfo | null {
  const value = (window.history.state as Record<string, unknown> | null)?.[STATE_KEY];
  if (!value || typeof value !== "object") {
    return null;
  }
  const { videoName, videoCover } = value as Partial<VideoFilterInfo>;
  return {
    videoName: typeof videoName === "string" ? videoName : null,
    videoCover: typeof videoCover === "string" ? videoCover : null,
  };
}
