import Artplayer from "artplayer";
import Hls from "hls.js";
import {
  shallowRef,
  reactive,
  useTemplateRef,
  ref,
  watch,
  computed,
} from "vue";
// video source will be provided by backend at runtime
import stateSrc from "@/assets/player/play.svg";
import rollingLoadingSrc from "@/assets/player/rolling-loading.svg";
import indicatorSrc from "@/assets/player/indicator.svg";
import artplayerPluginHlsControl from "artplayer-plugin-hls-control";
import closeTheaterModeSrc from "@/assets/player/close-theater-mode.svg";
import theaterModeSrc from "@/assets/player/theater-mode.svg";
import artplayerPluginDanmuku, {
  type Danmu as ArtplayerDanmu,
} from "artplayer-plugin-danmuku";
import message from "@/shared/lib/message";
import useVideoStateStore from "@/pages/videoDetail/store/VideoStateStore";
import { useRoute } from "vue-router";
import { Api, ServicePrefixMap } from "@/shared/config/Api";
import { ServiceType } from "@/shared/model/ServiceType";
import { imgRequestUrl } from "@/shared/utils/ImgUtil";
import {
  type Danmaku,
  fromArtplayerDanmu,
  toArtplayerDanmu,
} from "@/shared/model/Danmaku";
import router from "@/app/router";
import { useLoginStateStore } from "@/shared/store/LoginStateStore";
import * as videoApi from "@/features/player/api/VideoApi";
import * as videoOnlineApi from "@/features/player/api/VideoOnlineApi";
import { useDanmakuStore } from "@/features/player/store/DanmakuStore";

export function usePlayer() {
  const route = useRoute();
  const videoStateStore = useVideoStateStore();
  const loginStateStore = useLoginStateStore();

  const danmakuStore = useDanmakuStore();

  const $container = useTemplateRef<HTMLDivElement>("$container");
  const art = shallowRef<Artplayer | null>();

  const playerHeight = ref(500);
  const style = reactive({
    width: "100%",
    height: "100%",
    minWidth: "0",
  });

  let playlistBlobUrl = "";

  const coverSrc = ref<string>("");

  let toggleButtonListener: (() => void) | null = null;
  let toggleButtonSetupTimer: number | null = null;

  // 用于防止全屏切换过渡期间重入
  let fullscreenTransitioning = false;
  // 全屏按钮拦截器的清理函数
  let fullscreenButtonCleanup: (() => void) | null = null;
  // 记录是否从网页全屏进入原生全屏，以便退出时恢复
  let restoreWebFullscreen = false;

  function loadCover(videoCover: string | null) {
    coverSrc.value = imgRequestUrl(videoCover);

    if (art.value) {
      art.value.poster = coverSrc.value;
    }
  }

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

  const videoId = computed(() => route.params.videoId as string);

  // save danmaku to database
  async function postDanmaku(danmaku: Danmaku): Promise<boolean> {
    if (!loginStateStore.loginState) {
      message.error("请先登录");
      return false;
    }
    const result = await videoApi.postDanmaku(danmaku);
    return Boolean(result);
  }

  /**
   * load danmaku list from backend and update the danmakuList ref
   */
  async function loadDanmakuList(): Promise<void> {
    if (!videoId.value) {
      return;
    }
    const loadedDanmakuList = await videoApi.loadDanmakuList(
      videoId.value,
      Number(route.params.index) || 1,
    );
    danmakuStore.setDanmakuList(
      Array.isArray(loadedDanmakuList) ? loadedDanmakuList : [],
    );
  }

  /**
   * Build the browser-reachable backend prefix for video resources.
   * Must be an absolute URL so Hls.js can fetch TS segments without resolving
   * them relative to the blob playlist URL (which would mangle the URL).
   */
  function getVideoResourceBaseUrl() {
    return `${window.location.origin}${import.meta.env.VITE_APP_BASE_URL}${ServicePrefixMap[ServiceType.web] || ""}`;
  }

  /**
   * Build a playable TS URL that matches the backend controller signature.
   */
  function buildTsUrl(tsPathStr: string, index: number) {
    return `${getVideoResourceBaseUrl()}${Api.downloadTsResource}/${videoId.value}?index=${index}&tsPathStr=${encodeURIComponent(tsPathStr)}`;
  }

  /**
   * Rewrite a raw m3u8 playlist so every relative TS file name becomes a reachable backend URL.
   */
  function rewriteRawM3U8(rawM3U8: string, index: number) {
    return rawM3U8
      .split(/\r?\n/)
      .map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) {
          return line;
        }
        return buildTsUrl(trimmed, index);
      })
      .join("\n");
  }

  /**
   * Turn rewritten playlist text into a blob URL that Artplayer/Hls.js can consume.
   */
  function createPlaylistBlobUrl(rawM3U8: string, index: number) {
    if (playlistBlobUrl) {
      URL.revokeObjectURL(playlistBlobUrl);
      playlistBlobUrl = "";
    }

    const rewrittenM3U8 = rewriteRawM3U8(rawM3U8, index);
    const blob = new Blob([rewrittenM3U8], {
      type: "application/vnd.apple.mpegurl",
    });
    playlistBlobUrl = URL.createObjectURL(blob);
    return playlistBlobUrl;
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
   * Ask the backend for the raw m3u8 text, rewrite TS lines into backend URLs,
   * then hand the generated playlist blob to Artplayer.
   */
  async function loadVideoFileByIndex(index: number) {
    if (index <= 0) {
      index = 1;
    }
    const rawM3U8 = await videoApi.getVideoResource(videoId.value, index);

    if (!rawM3U8 || typeof rawM3U8 !== "string") {
      message.error("获取资源失败");
      return;
    }

    const playlistUrl = createPlaylistBlobUrl(rawM3U8, index);
    await loadRemote(playlistUrl);
  }

  function initArt() {
    // 防止重复初始化
    if (art.value) {
      console.warn(
        "Artplayer already initialized, destroying old instance first",
      );
      art.value.destroy(false);
    }

    // Create the player shell first; the real HLS source is loaded from the backend.
    // initalize Artplayer
    art.value = new Artplayer({
      container: $container.value as HTMLDivElement,
      url: "",
      type: "m3u8",
      customType: {
        m3u8: function (video, url, art) {
          if (Hls.isSupported()) {
            if ((art as any).hls) (art as any).hls.destroy();
            const hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(video);
            (art as any).hls = hls;
            art.on("destroy", () => hls.destroy());
          } else if (
            video.canPlayType &&
            video.canPlayType("application/vnd.apple.mpegurl")
          ) {
            (video as HTMLVideoElement).src = url;
          } else {
            art.notice.show = "浏览器不支持该播放格式";
          }
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
            // Show qualitys in control
            control: true,
            // Show qualitys in setting
            setting: true,
            // Get the quality name from level
            getName: (level: any) => `${level.height}P`,
            // I18n
            title: "Quality",
            auto: "Auto",
          },
          audio: {
            // Show audios in control
            control: true,
            // Show audios in setting
            setting: true,
            // Get the audio name from track
            getName: (track: any) => track.name,
            // I18n
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
            if (!result) {
              return false;
            }
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
      // layers: [
      //     {
      //         html: '<img width="100" src="/assets/sample/layer.png">',
      //         click() {
      //             window.open('https://aimu.app')
      //             console.info('You clicked on the custom layer')
      //         },
      //         style: {
      //             position: 'absolute',
      //             top: '20px',
      //             right: '20px',
      //             opacity: '.9',
      //         },
      //     },
      // ],
      // quality: [
      //     {
      //         default: true,
      //         html: 'SD 480P',
      //         url: '/assets/sample/video.mp4?q=480',
      //     },
      //     {
      //         html: 'HD 720P',
      //         url: '/assets/sample/video.mp4?q=720',
      //     },
      // ],
      // thumbnails: {
      //     url: '/assets/sample/thumbnails.png',
      //     number: 60,
      //     column: 10,
      //     scale: 0.85,
      // },
      // subtitle: {
      //     url: '/assets/sample/subtitle.srt',
      //     type: 'srt',
      //     style: {
      //         color: '#fe9200',
      //         fontSize: '20px',
      //     },
      //     encoding: 'utf-8',
      // },
      // highlight: [
      //     {
      //         time: 15,
      //         text: 'One more chance',
      //     },
      //     {
      //         time: 30,
      //         text: '谁でもいいはずなのに',
      //     },
      // ],
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

    art.value.on("destroy", () => {
      if (playlistBlobUrl) {
        URL.revokeObjectURL(playlistBlobUrl);
        playlistBlobUrl = "";
      }
      // 清理弹幕 toggle 按钮监听器
      if (toggleButtonListener) {
        const toggleButton = document.querySelector(".apd-toggle");
        if (toggleButton) {
          toggleButton.removeEventListener("click", toggleButtonListener);
        }
        toggleButtonListener = null;
      }
      // 清理 setTimeout
      if (toggleButtonSetupTimer !== null) {
        clearTimeout(toggleButtonSetupTimer);
        toggleButtonSetupTimer = null;
      }
      // 清理全屏按钮捕获监听器和 fullscreenchange 恢复监听
      fullscreenButtonCleanup?.();
      fullscreenButtonCleanup = null;
      restoreWebFullscreen = false;
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

  /** print the current Artplayer instance */
  function getInstance() {
    console.log(art.value);
  }

  // watch for detecting video file changes to load new source from backend
  watch(
    () => [route.params.videoId, route.params.index],
    ([nextVideoId, nextIndex]) => {
      if (!nextVideoId || !art.value) {
        return;
      }
      void loadVideoFileByIndex(Number(nextIndex));
      void loadDanmakuList();
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

  const VIDEO_ONLINE_SESSION_ID_KEY = "video-online-session-id";
  const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  let memorySessionId: string | null = null;
  /**
   * Create a UUID v4 session id with far low collision probability.
   */
  function createSessionId(): string {
    // 1. use built-in crypto API if available for better randomness and performance
    if (globalThis.crypto?.randomUUID) {
      return globalThis.crypto.randomUUID();
    }
    // 2. fallback to manual UUID v4 generation using crypto.getRandomValues if available
    if (globalThis.crypto?.getRandomValues) {
      const randomValues = new Uint8Array(16);
      globalThis.crypto.getRandomValues(randomValues);
      randomValues[6] = ((randomValues[6] ?? 0) & 0x0f) | 0x40;
      randomValues[8] = ((randomValues[8] ?? 0) & 0x3f) | 0x80;

      const hex = Array.from(randomValues, value =>
        value.toString(16).padStart(2, "0"),
      );
      return [
        hex.slice(0, 4).join(""),
        hex.slice(4, 6).join(""),
        hex.slice(6, 8).join(""),
        hex.slice(8, 10).join(""),
        hex.slice(10, 16).join(""),
      ].join("-");
    }
    // 3. fallback to timestamp and random values if crypto API is not available
    return `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
  }

  /**
   * Get one stable viewer session id for the current browser.
   * This works for both logged-in and anonymous users.
   *
   * localStorage is used on purpose so the same browser keeps the same id
   * across page switches and repeated heartbeat calls.
   */
  function getVideoOnlineSessionId(): string {
    // id session id has been saved in memory, return it directly for better performance
    if (memorySessionId) {
      return memorySessionId;
    }
    // else we will search for a valid session id in localStorage, if there is none, we will create a new one, store it in localStorage and return it
    try {
      // if there is a valid session id stored in localStorage, use it
      const storedValue = window.localStorage.getItem(
        VIDEO_ONLINE_SESSION_ID_KEY,
      );
      const storedSessionId = storedValue?.trim();
      if (storedSessionId && UUID_PATTERN.test(storedSessionId)) {
        memorySessionId = storedSessionId;
        return storedSessionId;
      }
      // else create a new session id, store it in localStorage and return it
      const newSessionId = createSessionId();
      window.localStorage.setItem(
        VIDEO_ONLINE_SESSION_ID_KEY,
        String(newSessionId),
      );
      memorySessionId = newSessionId;
      return newSessionId;
    } catch {
      memorySessionId = createSessionId();
      return memorySessionId;
    }
  }

  let watcherCount = ref("1");

  function sendHeartbeat() {
    videoOnlineApi.sendHeartbeat(
      videoId.value,
      Number(route.params.index) || 1,
      getVideoOnlineSessionId(),
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

  let timer = ref(0);
  const interval: number = 5_000;
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
  /**
   * 清理所有资源，防止内存泄漏
   * 应该在组件 onBeforeUnmount 时调用
   */
  function cleanup() {
    // 清理定时器
    cleanTimer();

    // 清理弹幕 toggle 按钮的 setTimeout
    if (toggleButtonSetupTimer !== null) {
      clearTimeout(toggleButtonSetupTimer);
      toggleButtonSetupTimer = null;
    }

    // 清理弹幕 toggle 按钮监听器
    if (toggleButtonListener) {
      const toggleButton = document.querySelector(".apd-toggle");
      if (toggleButton) {
        toggleButton.removeEventListener("click", toggleButtonListener);
      }
      toggleButtonListener = null;
    }

    // 清理全屏按钮捕获监听器和 fullscreenchange 恢复监听
    fullscreenButtonCleanup?.();
    fullscreenButtonCleanup = null;
    restoreWebFullscreen = false;

    // 清理 blob URL
    if (playlistBlobUrl) {
      URL.revokeObjectURL(playlistBlobUrl);
      playlistBlobUrl = "";
    }

    // 销毁播放器实例
    if (art.value) {
      art.value.destroy(false);
      art.value = null;
    }
  }
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
