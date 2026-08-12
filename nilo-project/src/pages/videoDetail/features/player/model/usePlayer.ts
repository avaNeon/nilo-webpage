// ============================================================
// Vue core
// ============================================================
import {
  shallowRef,
  reactive,
  useTemplateRef,
  ref,
  watch,
  computed,
} from "vue";
import { useRoute } from "vue-router";

// ============================================================
// Third-party libraries
// ============================================================
import Cookies from "js-cookie";
import Artplayer from "artplayer";
import Hls from "hls.js";
import artplayerPluginHlsControl from "artplayer-plugin-hls-control";
import artplayerPluginDanmuku, {
  type Danmu as ArtplayerDanmu,
} from "artplayer-plugin-danmuku";

// ============================================================
// Assets
// ============================================================
import rollingLoadingSrc from "@/assets/player/rolling-loading.svg";
import indicatorSrc from "@/assets/player/indicator.svg";
import closeTheaterModeSrc from "@/assets/player/close-theater-mode.svg";
import theaterModeSrc from "@/assets/player/theater-mode.svg";

// ============================================================
// Local modules
// ============================================================
import router from "@/app/router";
import message from "@/shared/lib/message";
import { imgRequestUrl } from "@/shared/utils/ImgUtil";
import { useLoginStateStore } from "@/shared/store/LoginStateStore";
import {
  type Danmaku,
  fromArtplayerDanmu,
  toArtplayerDanmu,
} from "@/shared/model/Danmaku";
import useVideoStateStore from "@/pages/videoDetail/store/VideoStateStore";
import { useDanmakuStore } from "@/pages/videoDetail/features/player/store/DanmakuStore";
import { createDanmakuLoader } from "@/pages/videoDetail/features/player/model/useDanmakuLoader";
import { videoFileApi } from "@/shared/api/VideoFileApi";
import * as videoApi from "@/pages/videoDetail/features/player/api/VideoApi";
import * as videoOnlineApi from "@/pages/videoDetail/features/player/api/VideoOnlineApi";
import { usePlayCount } from "@/pages/videoDetail/features/player/model/usePlayCount";
import { VideoPlayHistoryApi } from "@/shared/api/VideoPlayHistoryApi";
import { getOrCreateSessionId } from "@/shared/lib/sessionId";

// ============================================================
// Module-level constants
// ============================================================

const HLS_CONFIG = {
  maxFragLookUpTolerance: 0.5,
  // fast fail
  fragLoadingTimeOut: 5000,
  fragLoadingMaxRetry: 2,
  fragLoadingRetryDelay: 500,
  manifestLoadingMaxRetry: 2,
  startLevel: -1,
  // 仅后端鉴权 HLS 带 token；MinIO 直连不要带，否则 CORS 会挂
  xhrSetup(xhr: XMLHttpRequest, url: string) {
    const isBackendHls = url.includes("/file/video/hls/");
    if (!isBackendHls) return;
    xhr.withCredentials = true;
    const token = Cookies.get("token_normal");
    if (token) {
      xhr.setRequestHeader("token", token);
    }
  },
};

// ============================================================
// usePlayer composable
// ============================================================
export function usePlayer() {
  // ──────────────────────────────────────────────────────────
  // Stores & router
  // ──────────────────────────────────────────────────────────
  const route = useRoute();
  const videoStateStore = useVideoStateStore();
  const loginStateStore = useLoginStateStore();
  const danmakuStore = useDanmakuStore();
  const { tryReportPlayCount } = usePlayCount();
  const videoId = computed(() => route.params.videoId as string);

  // ──────────────────────────────────────────────────────────
  // Reactive state
  // ──────────────────────────────────────────────────────────
  const $container = useTemplateRef<HTMLDivElement>("$container");
  const art = shallowRef<Artplayer | null>();
  const playerHeight = ref(500);
  const style = reactive({
    width: "100%",
    height: "100%",
    minWidth: "0",
  });
  const coverSrc = ref<string>("");
  const watcherCount = ref("1");
  const timer = ref(0);
  const interval = 10_000;

  const danmakuLoader = createDanmakuLoader({
    getVideoId: () => videoId.value,
    getFileIndex: () => Number(route.params.index) || 1,
    getDurationMs: () => {
      const durationSec = art.value?.duration;
      if (!durationSec || !Number.isFinite(durationSec) || durationSec <= 0) {
        return Number.POSITIVE_INFINITY;
      }
      return Math.floor(durationSec * 1000);
    },
    onDanmakuAdded: added => {
      const plugin = getDanmakuPlugin();
      if (!plugin?.emit) return;
      // 只追加新增条目。切勿 load(全量数组)：插件 load(有参) 不清队列只会 append
      for (const item of added) {
        plugin.emit(toArtplayerDanmu(item));
      }
    },
  });

  // ──────────────────────────────────────────────────────────
  // Non-reactive module state
  // ──────────────────────────────────────────────────────────
  let toggleButtonListener: (() => void) | null = null;
  let toggleButtonSetupTimer: number | null = null;

  // 用于防止全屏切换过渡期间重入
  let fullscreenTransitioning = false;
  // 全屏按钮拦截器的清理函数
  let fullscreenButtonCleanup: (() => void) | null = null;
  // 记录是否从网页全屏进入原生全屏，以便退出时恢复
  let restoreWebFullscreen = false;
  // 记录上一次上报播放历史的分P，避免同一分P暂停后继续播放重复上报
  let lastReportedHistoryKey: string | null = null;
  /** 设置面板「循环播放」偏好（不能依赖 video.loop / 初始化后的 option.loop） */
  let userPreferLoop = false;
  /** 自动连播切分 P 后需要主动 play */
  let pendingAutoPlayNext = false;

  /** 当前分 P 之后是否还有下一集 */
  function hasNextPartition() {
    const currentIndex = Number(route.params.index) || 1;
    return (
      videoStateStore.videoFileList.length > 1 &&
      currentIndex < videoStateStore.videoFileList.length
    );
  }

  /** 本集重播（HLS/MSE 下原生 loop 不可靠，对齐 Artplayer 自身实现） */
  async function replayCurrentPartition() {
    const player = art.value;
    if (!player) return;
    player.seek = 0;
    try {
      await player.play();
      player.controls.show = false;
      player.mask.show = false;
    } catch (error) {
      console.warn("[player] 循环播放起播失败", error);
    }
  }

  /** 同步设置面板里的「循环播放」开关 UI */
  function syncLoopSettingUi(enabled: boolean) {
    if (!art.value) return;
    art.value.setting.update({
      name: "loop-play",
      html: "循环播放",
      switch: enabled,
      tooltip: enabled ? "开启" : "关闭",
    } as any);
  }

  // ──────────────────────────────────────────────────────────
  // 封面
  // ──────────────────────────────────────────────────────────
  function loadCover(videoCover: string | null) {
    // VideoDetail 固定公开封面
    coverSrc.value = imgRequestUrl(videoCover);
    if (art.value) {
      art.value.poster = coverSrc.value;
    }
  }

  // ──────────────────────────────────────────────────────────
  // Theater mode
  // ──────────────────────────────────────────────────────────
  function enableTheaterMode() {
    videoStateStore.setDisplayMode("theater");
    playerHeight.value = 560;
    const theaterMode = art.value?.controls?.["theater-mode"];
    const closeTheaterMode = art.value?.controls?.["close-theater-mode"];

    if (theaterMode && "style" in theaterMode) {
      theaterMode.style.display = "none";
    }
    if (closeTheaterMode && "style" in closeTheaterMode) {
      closeTheaterMode.style.display = "flex";
    }
  }

  function disableTheaterMode() {
    videoStateStore.setDisplayMode("normal");
    playerHeight.value = 500;
    const theaterMode = art.value?.controls?.["theater-mode"];
    const closeTheaterMode = art.value?.controls?.["close-theater-mode"];

    if (theaterMode && "style" in theaterMode) {
      theaterMode.style.display = "flex";
    }
    if (closeTheaterMode && "style" in closeTheaterMode) {
      closeTheaterMode.style.display = "none";
    }
  }

  // ──────────────────────────────────────────────────────────
  // Danmaku
  // ──────────────────────────────────────────────────────────
  async function postDanmaku(danmaku: Danmaku): Promise<boolean> {
    if (!loginStateStore.loginState) {
      message.error("请先登录");
      return false;
    }
    const result = await videoApi.postDanmaku(danmaku);
    return Boolean(result);
  }

  function getDanmakuPlugin() {
    return art.value?.plugins?.artplayerPluginDanmuku as
      | {
          load?: (target?: unknown) => void;
          reset?: () => void;
          emit?: (danmu: ArtplayerDanmu) => unknown;
        }
      | undefined;
  }

  /** 换分 P / 换视频：清空覆盖集与列表，并重置插件 */
  function resetDanmakuSession() {
    danmakuLoader.reset();
    // load() 无参会清空插件队列并按 option.danmuku 重建（此时 store 已空）
    void getDanmakuPlugin()?.load?.();
  }

  async function ensureDanmakuAtCurrentTime() {
    const t = art.value?.currentTime ?? 0;
    await danmakuLoader.onSeekOrReady(t);
    // 新增条目由 onDanmakuAdded -> emit；已覆盖区间无需再动插件队列
  }

  // ──────────────────────────────────────────────────────────
  // HLS quality helpers
  // ──────────────────────────────────────────────────────────
  function getQualityName(level: any) {
    switch (level.height) {
      case 480:
        return "标清 480P";
      case 720:
        return "高清 720P";
      default:
        return `${level.height}P`;
    }
  }

  function buildQualitySelector(hls: Hls) {
    const seen = new Set<string>();
    const selector = hls.levels
      .map((level, index) => ({
        html: getQualityName(level),
        value: index,
        default: hls.currentLevel === index,
      }))
      .filter(item => {
        if (seen.has(item.html)) return false;
        seen.add(item.html);
        return true;
      })
      .sort((a, b) => b.value - a.value);

    selector.push({
      html: "自动",
      value: -1,
      default: hls.currentLevel === -1,
    });
    return selector;
  }

  function setupSmoothQualitySwitch(art: Artplayer, hls: Hls) {
    let pendingLevel: number | null = null;

    const updateQualityUi = () => {
      if (!hls.levels.length) return;
      const currentLevel = hls.levels[hls.currentLevel];
      const tooltip = currentLevel ? getQualityName(currentLevel) : "自动";
      const selector = buildQualitySelector(hls);

      const onSelect = (item: any) => {
        const selectedLevel =
          typeof item?.value === "number" ? item.value : Number(item?.value);
        const selectedLabel = String(item?.html ?? "");

        if (selectedLevel === -1) {
          hls.nextLevel = -1;
          pendingLevel = null;
          art.notice.show = `画质: ${selectedLabel || "自动"}`;
          return selectedLabel;
        }

        hls.nextLevel = selectedLevel;
        pendingLevel = selectedLevel;
        art.notice.show = `画质: ${selectedLabel}（切换中）`;
        return selectedLabel;
      };

      art.controls.update({
        name: "hls-quality",
        position: "right",
        html: tooltip,
        style: { padding: "0 10px" },
        selector,
        onSelect,
      } as any);

      art.setting.update({
        name: "hls-quality",
        tooltip,
        html: "画质",
        width: 200,
        selector,
        onSelect,
      } as any);
    };

    const onManifestParsed = () => {
      updateQualityUi();
    };

    const onLevelSwitched = (_event: string, data: { level: number }) => {
      updateQualityUi();
      if (data.level === -1) return;
      const label = getQualityName(hls.levels[data.level]);

      if (pendingLevel !== null && data.level === pendingLevel) {
        // 手动切换成功
        art.notice.show = `已切换到：${label}`;
        pendingLevel = null;
      } else if (pendingLevel === null) {
        // ABR 自动切换
        art.notice.show = `自动切换到：${label}`;
      }
    };

    hls.on(Hls.Events.MANIFEST_PARSED, onManifestParsed);
    hls.on(Hls.Events.LEVEL_SWITCHED, onLevelSwitched);

    const onDestroy = () => {
      hls.off(Hls.Events.MANIFEST_PARSED, onManifestParsed);
      hls.off(Hls.Events.LEVEL_SWITCHED, onLevelSwitched);
      art.off("destroy", onDestroy);
    };
    art.on("destroy", onDestroy);
  }

  // ──────────────────────────────────────────────────────────
  // HLS instance & video loading
  // ──────────────────────────────────────────────────────────
  function createHls(video: HTMLVideoElement, url: string, art: Artplayer) {
    // Destroy previous instance if one exists (e.g. on switchUrl).
    if ((art as any).hls) {
      (art as any).hls.destroy();
      delete (art as any).hls;
    }

    if (!Hls.isSupported()) {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
      } else {
        art.notice.show = "浏览器不支持该播放格式";
      }
      return;
    }

    const hls = new Hls(HLS_CONFIG);
    hls.loadSource(url);
    hls.attachMedia(video);
    (art as any).hls = hls;
    setupSmoothQualitySwitch(art, hls);

    // Clean up on destroy so the instance doesn't outlive the player.
    const onDestroy = () => {
      hls.destroy();
      art.off("destroy", onDestroy);
    };
    art.on("destroy", onDestroy);
  }

  /** 切换远程 HLS 源 */
  async function loadRemote(url: string) {
    if (!art.value) return;
    await art.value.switchUrl(url);
  }

  /** 确保分 P 列表已加载 */
  async function ensureVideoFileList(): Promise<void> {
    if (videoStateStore.videoFileList.length > 0) return;
    const id = videoId.value;
    if (!id) return;
    const result = await videoFileApi.loadVideoFileList(id);
    if (result?.length) {
      videoStateStore.setVideoFileList(result);
    }
  }

  /** VideoDetail：固定 public/{filePath}/master.m3u8 */
  async function loadVideoFileByIndex(index: number) {
    let fileIndex = Number(index);
    if (!Number.isFinite(fileIndex) || fileIndex <= 0) {
      fileIndex = 1;
    }

    await ensureVideoFileList();

    const fileList = videoStateStore.videoFileList;
    const file =
      fileList.find(f => Number(f.fileIndex) === fileIndex) ??
      fileList[fileIndex - 1];
    const filePath = file?.filePath?.trim();
    if (!filePath) {
      console.warn("[player] 缺少 filePath，无法拼 public HLS", {
        fileIndex,
        file,
        fileList,
      });
      return;
    }

    const url = videoApi.getPublicVideoResource(filePath);
    if (!url) return;
    await loadRemote(url);
  }

  // ──────────────────────────────────────────────────────────
  // Internal cleanup helpers
  // (shared between art.destroy handler & top-level cleanup())
  // ──────────────────────────────────────────────────────────
  function cleanupToggleButton() {
    if (toggleButtonListener) {
      const toggleButton = document.querySelector(".apd-toggle");
      if (toggleButton) {
        toggleButton.removeEventListener("click", toggleButtonListener);
      }
      toggleButtonListener = null;
    }
    if (toggleButtonSetupTimer !== null) {
      clearTimeout(toggleButtonSetupTimer);
      toggleButtonSetupTimer = null;
    }
  }

  function cleanupFullscreenButton() {
    fullscreenButtonCleanup?.();
    fullscreenButtonCleanup = null;
    restoreWebFullscreen = false;
  }

  // ──────────────────────────────────────────────────────────
  // Artplayer initialization
  // ──────────────────────────────────────────────────────────
  function initArt() {
    // 防止重复初始化
    if (art.value) {
      console.warn(
        "Artplayer already initialized, destroying old instance first",
      );
      art.value.destroy(false);
    }

    userPreferLoop = false;
    pendingAutoPlayNext = false;

    // Create the player shell first; the real HLS source is loaded from the backend.
    art.value = new Artplayer({
      container: $container.value as HTMLDivElement,
      url: "",
      type: "m3u8",
      customType: {
        m3u8: function (video, url, art) {
          createHls(video, url, art);
        },
      },
      poster: coverSrc.value,
      volume: 0.6,
      isLive: false,
      muted: false,
      autoplay: false,
      pip: true,
      autoSize: false,
      autoMini: true,
      screenshot: true,
      setting: true,
      // 始终交给下方 video:ended 自定义处理；Artplayer 只认初始化时的 option.loop
      loop: false,
      flip: true,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: true,
      subtitleOffset: false,
      miniProgressBar: true,
      mutex: true,
      backdrop: true,
      playsInline: true,
      autoPlayback: true,
      airplay: true,
      theme: "#23ade5",
      lang: navigator.language.toLowerCase(),
      moreVideoAttr: {
        crossOrigin: "anonymous",
      },
      settings: [
        {
          name: "loop-play",
          html: "循环播放",
          tooltip: "关闭",
          switch: false,
          onSwitch(item) {
            const next = !item.switch;
            userPreferLoop = next;
            item.tooltip = next ? "开启" : "关闭";
            // 与自动连播互斥
            if (next && videoStateStore.autoPlay) {
              videoStateStore.setAutoPlay(false);
            }
            return next;
          },
        },
      ],
      icons: {
        loading: `<img src="${rollingLoadingSrc}">`,
        state: document.querySelector("#play") as HTMLDivElement,
        indicator: `<img width="16" height="16" src="${indicatorSrc}">`,
      },
      controls: [
        {
          name: "theater-mode",
          position: "right",
          html: `<img src="${theaterModeSrc}">`,
          index: 1,
          tooltip: "剧场模式",
          style: {},
          click() {
            enableTheaterMode();
          },
        },
        {
          name: "close-theater-mode",
          position: "right",
          html: `<img src="${closeTheaterModeSrc}">`,
          index: 2,
          tooltip: "关闭剧场模式",
          style: {
            display: "none",
          },
          click() {
            disableTheaterMode();
          },
        },
      ],
      plugins: [
        artplayerPluginHlsControl({
          quality: {
            control: false,
            setting: false,
            getName: (level: any) => getQualityName(level),
            title: "画质",
            auto: "自动",
          },
          audio: {
            control: true,
            setting: true,
            getName: (track: any) => track.name,
            title: "Audio",
            auto: "Auto",
          },
        }),
        artplayerPluginDanmuku({
          mount: document.querySelector("#danmaku") as HTMLDivElement,
          // 初始为空；后续由增量 loader 经 load() 注入
          danmuku: async function () {
            return danmakuStore.danmakuList.map(toArtplayerDanmu);
          },
          theme: "light",
          async beforeEmit(danmaku: ArtplayerDanmu) {
            if (!danmakuStore.danmakuEnabled) {
              message.warning("请先开启弹幕显示");
              return false;
            }

            const isDirty = /fuck/i.test(danmaku.text);
            if (isDirty) return false;
            const payload = fromArtplayerDanmu(danmaku, {
              videoId: videoStateStore.videoInfo.videoId as string,
              fileIndex: Number(route.params.index) || 1,
            });
            const result = await postDanmaku(payload);
            if (!result) return false;

            message.success("弹幕发送成功");
            danmakuLoader.addLocalDanmaku(payload);

            return true;
          },

          filter(danmu: ArtplayerDanmu) {
            return danmu.text.length <= 200;
          },

          async beforeVisible(_danmu) {
            return true;
          },
        }),
      ],
    });

    // 播放器创建后立即拉分 P 并起播 public HLS
    if (videoId.value) {
      void loadVideoFileByIndex(Number(route.params.index));
    }

    // 修复：从网页全屏切换至原生全屏时的闪烁问题。
    //
    // 根因：ArtPlayer 的原生全屏按钮 click handler 直接执行 `art.fullscreen = true`，
    // 其内部 setter 会立即调用 requestFullscreen()，但并不会先退出网页全屏（fullscreenWeb）。
    // 结果是 $player 元素同时携带 art-fullscreen-web（position:fixed 撑满视口）和
    // art-fullscreen（浏览器原生全屏）两个 class，两套样式并存，
    // 在 fullscreenchange 触发后 ArtPlayer emit resize，导致布局抖动，产生闪烁。
    //
    // 修复方案：在 ArtPlayer ready 后，用捕获阶段监听器拦截原生全屏按钮的 click 事件，
    // 若当前处于网页全屏，则阻止原始 click 冒泡，先主动退出网页全屏并等待一帧让浏览器
    // 完成布局回流，再手动进入原生全屏，确保两次状态切换严格串行，不产生样式冲突。
    art.value.on("ready", () => {
      const player = art.value;
      if (!player) return;

      void ensureDanmakuAtCurrentTime();

      const $player = (player as any).template?.$player as
        | HTMLElement
        | undefined;
      if (!$player) return;

      const fullscreenBtnHandler = (e: Event) => {
        // 仅在网页全屏激活时才需要拦截，避免干扰普通的全屏切换
        if (!player.fullscreenWeb || fullscreenTransitioning) return;

        // 只拦截来自原生全屏按钮自身的点击（art-icon-fullscreen-on/off 区域）
        const target = e.target as HTMLElement;
        const fullscreenBtn = $player.querySelector(".art-control-fullscreen");
        if (!fullscreenBtn?.contains(target)) return;

        e.stopImmediatePropagation();
        fullscreenTransitioning = true;
        restoreWebFullscreen = true;

        // 先退出网页全屏，等待一帧让浏览器完成布局回流，再进入原生全屏
        player.fullscreenWeb = false;
        requestAnimationFrame(() => {
          if (art.value) {
            art.value.fullscreen = true;
          }
          fullscreenTransitioning = false;
        });
      };

      $player.addEventListener("click", fullscreenBtnHandler, true);
      fullscreenButtonCleanup = () => {
        $player.removeEventListener("click", fullscreenBtnHandler, true);
      };

      // 退出原生全屏时，若之前从网页全屏进入，则恢复网页全屏
      const onFullscreenExit = () => {
        if (!document.fullscreenElement && restoreWebFullscreen) {
          restoreWebFullscreen = false;
          requestAnimationFrame(() => {
            if (art.value) {
              art.value.fullscreenWeb = true;
            }
          });
        }
      };
      document.addEventListener("fullscreenchange", onFullscreenExit);
      // 将清理逻辑合并到已有的 fullscreenButtonCleanup 中
      const origCleanup = fullscreenButtonCleanup;
      fullscreenButtonCleanup = () => {
        origCleanup();
        document.removeEventListener("fullscreenchange", onFullscreenExit);
      };
    });

    // 播放开始时记录播放历史：同一分P连续播放仅触发一次，切换分P后重新触发
    art.value.on("video:play", () => {
      const fileIndex = Number(route.params.index) || 1;
      const historyKey = `${videoId.value}:${fileIndex}`;

      if (lastReportedHistoryKey === historyKey) return;

      lastReportedHistoryKey = historyKey;
      void VideoPlayHistoryApi.saveHistory(videoId.value, fileIndex);
    });

    art.value.on("video:ended", () => {
      // 优先自动连播下一分 P
      if (videoStateStore.autoPlay && hasNextPartition()) {
        pendingAutoPlayNext = true;
        router.push({
          name: "video",
          params: {
            videoId: route.params.videoId,
            index: (Number(route.params.index) || 1) + 1,
          },
        });
        return;
      }

      // 否则按设置面板偏好循环本集
      if (userPreferLoop) {
        void replayCurrentPartition();
      }
    });

    art.value.on("seek", () => {
      // 仅把已显示弹幕回收为 wait，按新时间轴再匹配；不要 load(全量) 追加
      getDanmakuPlugin()?.reset?.();
      void ensureDanmakuAtCurrentTime();
    });

    art.value.on("destroy", () => {
      cleanupToggleButton();
      cleanupFullscreenButton();
    });

    // 弹幕增量预取：按播放进度推进覆盖前沿
    art.value.on("video:timeupdate", () => {
      const player = art.value;
      if (!player) return;
      danmakuLoader.onTimeUpdate(player.currentTime);
    });

    // 播放统计：累积实际播放15秒后上报一次
    art.value.on("video:timeupdate", function onTimeUpdate() {
      const player = art.value;

      if (!player) return;

      const needReport = tryReportPlayCount(player.currentTime);

      // 如果已经做好播放统计，结束记录
      if (needReport) {
        videoApi.reportPlayCount(videoId.value);
        player.off("video:timeupdate", onTimeUpdate);
      }
    });

    // 监听弹幕 toggle 按钮点击，每次点击翻转 danmakuEnabled 状态
    toggleButtonSetupTimer = window.setTimeout(() => {
      const toggleButton = document.querySelector(".apd-toggle");
      if (toggleButton) {
        toggleButtonListener = () => {
          danmakuStore.toggleDanmakuEnabled();
        };
        toggleButton.addEventListener("click", toggleButtonListener);
      }
      toggleButtonSetupTimer = null;
    }, 500);
  }

  // ──────────────────────────────────────────────────────────
  // Debug helper
  // ──────────────────────────────────────────────────────────
  function getInstance() {
    console.log(art.value);
  }

  // ──────────────────────────────────────────────────────────
  // Online heartbeat & counter
  // ──────────────────────────────────────────────────────────
  function sendHeartbeat() {
    videoOnlineApi.sendHeartbeat(
      videoId.value,
      Number(route.params.index) || 1,
      getOrCreateSessionId(),
    );
  }

  async function getOnlineCount() {
    watcherCount.value =
      (await videoOnlineApi.getOnlineCount(
        videoId.value,
        Number(route.params.index) || 1,
      )) ?? "1";
    if (watcherCount.value === "0") {
      watcherCount.value = "1";
    }
  }

  function startTimer() {
    timer.value = setInterval(() => {
      sendHeartbeat();
      getOnlineCount();
    }, interval);
  }

  function cleanTimer() {
    if (timer.value) {
      clearInterval(timer.value);
      timer.value = 0;
    }
  }

  // ──────────────────────────────────────────────────────────
  // Cleanup (should be called in onBeforeUnmount)
  // ──────────────────────────────────────────────────────────
  function cleanup() {
    cleanTimer();
    cleanupToggleButton();
    cleanupFullscreenButton();
    resetDanmakuSession();

    // 销毁播放器实例
    if (art.value) {
      art.value.destroy(false);
      art.value = null;
    }
  }

  // ──────────────────────────────────────────────────────────
  // Watchers
  // ──────────────────────────────────────────────────────────
  // 路由分 P 变化时重新起播
  watch(
    () => [route.params.videoId, route.params.index] as const,
    async ([nextVideoId, nextIndex]) => {
      if (!nextVideoId || !art.value) return;

      const shouldAutoPlay = pendingAutoPlayNext;
      pendingAutoPlayNext = false;

      resetDanmakuSession();
      await loadVideoFileByIndex(Number(nextIndex));
      void ensureDanmakuAtCurrentTime();

      if (shouldAutoPlay && art.value) {
        try {
          await art.value.play();
          art.value.controls.show = false;
          art.value.mask.show = false;
        } catch (error) {
          console.warn("[player] 自动连播起播失败", error);
        }
      }
    },
  );

  // 自动连播与循环播放互斥：开连播时关掉循环
  watch(
    () => videoStateStore.autoPlay,
    enabled => {
      if (enabled && userPreferLoop) {
        userPreferLoop = false;
        syncLoopSettingUi(false);
      }
    },
  );

  // 封面固定 public
  watch(
    () => videoStateStore.videoInfo.videoCover,
    videoCover => {
      loadCover(videoCover);
    },
    { immediate: true },
  );

  // ──────────────────────────────────────────────────────────
  // Public API
  // ──────────────────────────────────────────────────────────
  return {
    art,
    playerHeight,
    style,
    $container,
    videoStateStore,
    watcherCount,
    initArt,
    getInstance,
    loadRemote,
    loadVideoFileByIndex,
    startTimer,
    cleanTimer,
    cleanup,
  };
}
