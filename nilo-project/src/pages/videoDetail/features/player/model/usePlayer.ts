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
import Artplayer from "artplayer";
import Hls from "hls.js";
import artplayerPluginHlsControl from "artplayer-plugin-hls-control";
import artplayerPluginDanmuku, {
  type Danmu as ArtplayerDanmu,
} from "artplayer-plugin-danmuku";

// ============================================================
// Assets
// ============================================================
import stateSrc from "@/assets/player/play.svg";
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
import * as videoApi from "@/pages/videoDetail/features/player/api/VideoApi";
import * as videoOnlineApi from "@/pages/videoDetail/features/player/api/VideoOnlineApi";
import { usePlayCount } from "@/pages/videoDetail/features/player/model/usePlayCount";
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

  // ──────────────────────────────────────────────────────────
  // Computed
  // ──────────────────────────────────────────────────────────
  const videoId = computed(() => route.params.videoId as string);

  // ──────────────────────────────────────────────────────────
  // Cover
  // ──────────────────────────────────────────────────────────
  function loadCover(videoCover: string | null) {
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

  async function loadDanmakuList(): Promise<void> {
    if (!videoId.value) return;
    const loadedDanmakuList = await videoApi.loadDanmakuList(
      videoId.value,
      Number(route.params.index) || 1,
    );
    danmakuStore.setDanmakuList(
      Array.isArray(loadedDanmakuList) ? loadedDanmakuList : [],
    );
  }

  function getDanmakuPlugin() {
    return art.value?.plugins?.artplayerPluginDanmuku as
      | { load?: (target?: unknown) => void; reset?: () => void }
      | undefined;
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

  /**
   * Load a remote HLS source into Artplayer.
   * Artplayer's built-in switchUrl keeps playback state aligned with the new source.
   */
  async function loadRemote(url: string) {
    if (!art.value) return;
    await art.value.switchUrl(url);
  }

  /**
   * Load a video file by index using the HLS master playlist URL.
   * Hls.js natively handles variant stream discovery and TS segment fetching.
   */
  function loadVideoFileByIndex(index: number) {
    if (index <= 0) index = 1;
    const masterPlaylistUrl = videoApi.getVideoResource(videoId.value, index);
    loadRemote(masterPlaylistUrl);
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
      loop: true,
      flip: true,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: true,
      subtitleOffset: true,
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
          width: 200,
          html: "Subtitle",
          tooltip: "Bilingual",
          icon: '<img width="22" height="22" src="/assets/img/subtitle.svg">',
          selector: [
            {
              html: "Display",
              tooltip: "Show",
              switch: true,
              onSwitch(item) {
                item.tooltip = item.switch ? "Hide" : "Show";
                if (art.value) {
                  art.value.subtitle.show = !item.switch;
                }
                return !item.switch;
              },
            },
            {
              default: true,
              html: "Bilingual",
              url: "/assets/sample/subtitle.srt",
            },
            {
              html: "Chinese",
              url: "/assets/sample/subtitle.cn.srt",
            },
            {
              html: "Japanese",
              url: "/assets/sample/subtitle.jp.srt",
            },
          ],
          onSelect(item) {
            art.value?.subtitle.switch(item.url, {
              name: item.html,
            });
            return item.html;
          },
        },
        {
          html: "Switcher",
          icon: `<img width="22" height="22" src="${stateSrc}">`,
          tooltip: "OFF",
          switch: false,
          onSwitch(item) {
            item.tooltip = item.switch ? "OFF" : "ON";
            console.info("You clicked on the custom switch", item.switch);
            return !item.switch;
          },
        },
        {
          html: "Slider",
          icon: `<img width="22" height="22" src="${stateSrc}">`,
          tooltip: "5x",
          range: [5, 1, 10, 0.1],
          onRange(item) {
            return `${item.range[0]}x`;
          },
        },
        {
          html: "Button",
          icon: `<img width="22" height="22" src="${stateSrc}">`,
          tooltip: "tooltip",
          onClick() {
            return "Button clicked";
          },
        },
      ],
      contextmenu: [
        {
          html: "Custom menu",
          click(contextmenu) {
            console.info("You clicked on the custom menu");
            contextmenu.show = false;
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
          tooltip: "theater mode",
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
          tooltip: "close theater mode",
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
          danmuku: async function () {
            await loadDanmakuList();
            return danmakuStore.danmakuList.map(toArtplayerDanmu);
          },
          theme: "light",
          // 这是用户在输入框输入弹幕文本，然后点击发送按钮后触发的函数
          // 你可以对弹幕做合法校验，或者做存库处理
          // 当返回true后才表示把弹幕加入到弹幕队列
          async beforeEmit(danmaku: ArtplayerDanmu) {
            // 检查弹幕是否被关闭
            if (!danmakuStore.danmakuEnabled) {
              message.warning("请先开启弹幕显示");
              return false;
            }

            const isDirty = /fuck/i.test(danmaku.text);
            if (isDirty) return false;
            const result = await postDanmaku(
              fromArtplayerDanmu(danmaku, {
                videoId: videoStateStore.videoInfo.videoId as string,
                fileIndex: Number(route.params.index) || 1,
              }),
            );
            if (!result) return false;

            // notify that danmaku has been send successfully
            message.success("弹幕发送成功");
            // let's wait 2s for the new danmaku to be put in the database
            // in case that the new danmaku can't be counted immediately
            setTimeout(() => {
              loadDanmakuList();
            }, 2000);

            return true;
          },

          // 这里是所有弹幕的过滤器,包含来自服务端的和来自用户输入的
          // 你可以对弹幕做合法校验
          // 当返回true后才表示把弹幕加入到弹幕队列
          filter(danmu: ArtplayerDanmu) {
            return danmu.text.length <= 200;
          },

          // 这是弹幕即将显示的时触发的函数
          // 你可以对弹幕做合法校验
          // 当返回true后才表示可以马上发送到播放器里
          async beforeVisible(_danmu) {
            return true;
          },
        }),
      ],
    });

    // Load the initial route selection immediately after the player is created.
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

    art.value.on("video:ended", () => {
      if (
        videoStateStore.autoPlay &&
        videoStateStore.videoFileList.length > 1 &&
        Number(route.params.index) < videoStateStore.videoFileList.length
      ) {
        router.push({
          name: "video",
          params: {
            videoId: route.params.videoId,
            index: Number(route.params.index) + 1,
          },
        });
      }
    });

    art.value.on("seek", () => {
      getDanmakuPlugin()?.reset?.();
    });

    art.value.on("destroy", () => {
      cleanupToggleButton();
      cleanupFullscreenButton();
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

    // 销毁播放器实例
    if (art.value) {
      art.value.destroy(false);
      art.value = null;
    }
  }

  // ──────────────────────────────────────────────────────────
  // Watchers
  // ──────────────────────────────────────────────────────────
  // watch for detecting video file changes to load new source from backend
  watch(
    () => [route.params.videoId, route.params.index],
    ([nextVideoId, nextIndex]) => {
      if (!nextVideoId || !art.value) return;
      void loadVideoFileByIndex(Number(nextIndex));
      void loadDanmakuList().then(() => {
        // 通知 ArtPlayer 弹幕插件重新拉取弹幕数据，
        // 否则插件内部仍持有旧分P的弹幕
        getDanmakuPlugin()?.load?.();
      });
    },
  );

  // watch for loading video cover
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
