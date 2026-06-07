import useVideoStateStore from "@/pages/videoDetail/store/VideoStateStore";

/**
 * 播放统计上报 composable
 * 累积实际播放时长（暂停不计时、seek 不算），满5秒后上报一次，后续不再重复上报
 */
export function usePlayCount() {
  const videoStateStore = useVideoStateStore();

  let reported = false;
  let accumulatedTime = 0;
  let lastTime = 0;

  /**
   * 每次 timeupdate 时调用，累积实际播放时长
   * @param currentTime 当前播放进度（秒）
   * @returns true 表示已达到20%播放时长，需要上报，false 表示继续等待
   */
  function tryReportPlayCount(currentTime: number): boolean {
    // 如果视频数据没有加载好，返回false
    if (
      videoStateStore.videoInfo === null ||
      videoStateStore.videoInfo.duration === null
    ) {
      return false;
    }

    // 如果视频数据已上报，返回false
    if (reported) {
      return false;
    }

    // 首次调用初始化 lastTime
    if (lastTime === 0) {
      lastTime = currentTime;
      return false;
    }

    // 计算增量，限制最大单次增量（避免 seek 跳转导致误计）
    const delta = currentTime - lastTime;
    lastTime = currentTime;

    // 只累加合理的增量（超过3秒认为是 seek/跳转，不计入）
    if (delta > 0 && delta <= 3) {
      accumulatedTime += delta;
      console.log("增加播放时长：", delta, "  累计播放时长：", accumulatedTime);
    }

    if (accumulatedTime >= videoStateStore.videoInfo.duration * 0.2) {
      reported = true;
      return true;
    }

    return false;
  }

  /** 重置状态（例如重新初始化播放器时） */
  function reset() {
    reported = false;
    accumulatedTime = 0;
    lastTime = 0;
  }

  return { tryReportPlayCount, reset };
}
