import Artplayer from "artplayer"
import Hls from 'hls.js'
import { shallowRef, reactive, useTemplateRef, ref, watch, computed } from "vue"
// video source will be provided by backend at runtime
import stateSrc from '@/assets/player/play.svg'
import rollingLoadingSrc from '@/assets/player/rolling-loading.svg'
import indicatorSrc from '@/assets/player/indicator.svg'
import artplayerPluginHlsControl from 'artplayer-plugin-hls-control';
import closeTheaterModeSrc from '@/assets/player/close-theater-mode.svg'
import theaterModeSrc from '@/assets/player/theater-mode.svg'
import artplayerPluginDanmuku, { type Danmu } from "artplayer-plugin-danmuku"
import message from "@/shared/lib/message"
import useVideoStateStore from "@/pages/videoDetail/store/VideoStateStore"
import { useRoute } from "vue-router"
import request from "@/shared/lib/request"
import { Api, ServicePrefixMap } from "@/shared/config/Api"
import { ServiceType } from "@/shared/model/ServiceType"
import { imgRequestUrl } from "@/shared/utils/ImgUtil"
import router from "@/app/router"


export function usePlayer() {
    const route = useRoute()
    const videoStateStore = useVideoStateStore()

    const $container = useTemplateRef<HTMLDivElement>('$container')
    const art = shallowRef<Artplayer | null>()

    const playerHeight = ref(500)
    const style = reactive({
        width: '100%',
        height: '100%',
        minWidth: '0',
    })

    let playlistBlobUrl = ''

    const coverSrc = ref<string>('')

    function loadCover(videoCover: string | null) {
        coverSrc.value = imgRequestUrl(videoCover)

        if (art.value) {
            art.value.poster = coverSrc.value
        }
    }

    function enableTheaterMode() {
        videoStateStore.setDisplayMode('theater')
        playerHeight.value = 550
    }

    function disableTheaterMode() {
        videoStateStore.setDisplayMode('normal')
        playerHeight.value = 500
    }

    const videoId = computed(() => route.params.videoId as string)

    //TODO waiting for backend API
    // save danmaku to database
    function postDanmaku(_danmaku: any) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(true)
            }, 1000)
        })
    }

    //TODO waiting for backend API
    async function loadDanmakuList(): Promise<Danmu[]> {
        // if (!videoInfoFile.value || !videoInfoFile.value.fileName || !videoInfoFile.value.fileIndex) {
        //     return []
        // }
        // const result = await request({
        //     method: 'get',
        //     url: Api.loadDanmaku,
        //     params: {
        //         videoId: videoId.value,
        //         fileIndex: videoInfoFile.value.fileIndex,
        //     }
        // })
        // if (!result) {
        //     return []
        // }
        // danmakuList.value = result.data
        // return danmakuList.value
        return []
    }

    /**
     * Build the browser-reachable backend prefix for video resources.
     * Must be an absolute URL so Hls.js can fetch TS segments without resolving
     * them relative to the blob playlist URL (which would mangle the URL).
     */
    function getVideoResourceBaseUrl() {
        return `${window.location.origin}${import.meta.env.VITE_APP_BASE_URL}${ServicePrefixMap[ServiceType.web] || ''}`
    }

    /**
     * Build a playable TS URL that matches the backend controller signature.
     */
    function buildTsUrl(tsPathStr: string, index: number) {
        return `${getVideoResourceBaseUrl()}${Api.downloadTsResource}/${videoId.value}?index=${index}&tsPathStr=${encodeURIComponent(tsPathStr)}`
    }

    /**
     * Rewrite a raw m3u8 playlist so every relative TS file name becomes a reachable backend URL.
     */
    function rewriteRawM3U8(rawM3U8: string, index: number) {
        return rawM3U8
            .split(/\r?\n/)
            .map((line) => {
                const trimmed = line.trim()
                if (!trimmed || trimmed.startsWith('#')) {
                    return line
                }
                return buildTsUrl(trimmed, index)
            })
            .join('\n')
    }

    /**
     * Turn rewritten playlist text into a blob URL that Artplayer/Hls.js can consume.
     */
    function createPlaylistBlobUrl(rawM3U8: string, index: number) {
        if (playlistBlobUrl) {
            URL.revokeObjectURL(playlistBlobUrl)
            playlistBlobUrl = ''
        }

        const rewrittenM3U8 = rewriteRawM3U8(rawM3U8, index)
        const blob = new Blob([rewrittenM3U8], { type: 'application/vnd.apple.mpegurl' })
        playlistBlobUrl = URL.createObjectURL(blob)
        return playlistBlobUrl
    }

    /**
     * Load a remote HLS source into Artplayer.
     * Artplayer's built-in switchUrl keeps playback state aligned with the new source.
     */
    async function loadRemote(url: string) {
        if (!art.value) return
        await art.value.switchUrl(url)
    }

    /**
     * Ask the backend for the raw m3u8 text, rewrite TS lines into backend URLs,
     * then hand the generated playlist blob to Artplayer.
     */
    async function loadVideoFileByIndex(index: number) {
        if (index <= 0) {
            index = 1
        }
        const rawM3U8 = await request({
            method: 'get',
            url: Api.getVideoResource + "/" + videoId.value,
            params: {
                index,
            },
            responseType: 'text',
            showLoading: true,
        })

        if (!rawM3U8 || typeof rawM3U8 !== 'string') {
            message.error('获取资源失败')
            return
        }

        const playlistUrl = createPlaylistBlobUrl(rawM3U8, index)
        await loadRemote(playlistUrl)
    }

    function initArt() {
        // Create the player shell first; the real HLS source is loaded from the backend.
        // initalize Artplayer
        art.value = new Artplayer({
            container: $container.value as HTMLDivElement,
            url: '',
            type: 'm3u8',
            customType: {
                m3u8: function (video, url, art) {
                    if (Hls.isSupported()) {
                        if ((art as any).hls) (art as any).hls.destroy()
                        const hls = new Hls()
                        hls.loadSource(url)
                        hls.attachMedia(video)
                            ; (art as any).hls = hls
                        art.on('destroy', () => hls.destroy())
                    } else if (video.canPlayType && video.canPlayType('application/vnd.apple.mpegurl')) {
                        (video as HTMLVideoElement).src = url
                    } else {
                        art.notice.show = '浏览器不支持该播放格式'
                    }
                },
            },
            poster: coverSrc.value,
            volume: 0.6,
            isLive: false,
            muted: false,
            autoplay: videoStateStore.autoPlay,
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
            theme: '#23ade5',
            lang: navigator.language.toLowerCase(),
            moreVideoAttr: {
                crossOrigin: 'anonymous',
            },
            settings: [
                {
                    width: 200,
                    html: 'Subtitle',
                    tooltip: 'Bilingual',
                    icon: '<img width="22" height="22" src="/assets/img/subtitle.svg">',
                    selector: [
                        {
                            html: 'Display',
                            tooltip: 'Show',
                            switch: true,
                            onSwitch(item) {
                                item.tooltip = item.switch ? 'Hide' : 'Show'
                                if (art.value) {
                                    art.value.subtitle.show = !item.switch
                                }
                                return !item.switch
                            },
                        },
                        {
                            default: true,
                            html: 'Bilingual',
                            url: '/assets/sample/subtitle.srt',
                        },
                        {
                            html: 'Chinese',
                            url: '/assets/sample/subtitle.cn.srt',
                        },
                        {
                            html: 'Japanese',
                            url: '/assets/sample/subtitle.jp.srt',
                        },
                    ],
                    onSelect(item) {
                        art.value?.subtitle.switch(item.url, {
                            name: item.html,
                        })
                        return item.html
                    },
                },
                {
                    html: 'Switcher',
                    icon: `<img width="22" height="22" src="${stateSrc}">`,
                    tooltip: 'OFF',
                    switch: false,
                    onSwitch(item) {
                        item.tooltip = item.switch ? 'OFF' : 'ON'
                        console.info('You clicked on the custom switch', item.switch)
                        return !item.switch
                    },
                },
                {
                    html: 'Slider',
                    icon: `<img width="22" height="22" src="${stateSrc}">`,
                    tooltip: '5x',
                    range: [5, 1, 10, 0.1],
                    onRange(item) {
                        return `${item.range[0]}x`
                    },
                },
                {
                    html: 'Button',
                    icon: `<img width="22" height="22" src="${stateSrc}">`,
                    tooltip: 'tooltip',
                    onClick() {
                        return 'Button clicked'
                    },
                },
            ],
            contextmenu: [
                {
                    html: 'Custom menu',
                    click(contextmenu) {
                        console.info('You clicked on the custom menu')
                        contextmenu.show = false
                    },
                },
            ],
            icons: {
                loading: `<img src="${rollingLoadingSrc}">`,
                state: document.querySelector('#play') as HTMLDivElement,
                indicator: `<img width="16" height="16" src="${indicatorSrc}">`,
            },
            controls: [
                {
                    name: 'theater-mode',
                    position: 'right',
                    html: `<img src="${theaterModeSrc}">`,
                    index: 1,
                    tooltip: 'theater mode',
                    style: {
                    },
                    click() {
                        enableTheaterMode()
                    },
                },
                {
                    name: 'close-theater-mode',
                    position: 'right',
                    html: `<img src="${closeTheaterModeSrc}">`,
                    index: 2,
                    tooltip: 'close theater mode',
                    style: {
                    },
                    click() {
                        disableTheaterMode()
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
                        title: 'Quality',
                        auto: 'Auto',
                    },
                    audio: {
                        // Show audios in control
                        control: true,
                        // Show audios in setting
                        setting: true,
                        // Get the audio name from track
                        getName: (track: any) => track.name,
                        // I18n
                        title: 'Audio',
                        auto: 'Auto',
                    },
                }),
                artplayerPluginDanmuku({
                    mount: document.querySelector('#danmaku') as HTMLDivElement,
                    danmuku: function () {
                        return new Promise(async (resolve) => {
                            const danmakuList: Danmu[] = await loadDanmakuList()
                            return resolve(danmakuList)
                        })
                    },
                    theme: 'light',
                    // 这是用户在输入框输入弹幕文本，然后点击发送按钮后触发的函数
                    // 你可以对弹幕做合法校验，或者做存库处理
                    // 当返回true后才表示把弹幕加入到弹幕队列
                    async beforeEmit(danmaku: Danmu) {
                        const isDirty = (/fuck/i).test(danmaku.text)
                        if (isDirty) return false
                        const result = await postDanmaku(danmaku)
                        loadDanmakuList()
                        if (!result) {
                            return false
                        }
                        // notify that danmaku has been send successfully
                        message.success('弹幕发送成功')
                        return true
                    },

                    // 这里是所有弹幕的过滤器，包含来自服务端的和来自用户输入的
                    // 你可以对弹幕做合法校验
                    // 当返回true后才表示把弹幕加入到弹幕队列
                    filter(danmu) {
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
            //     {
            //         time: 45,
            //         text: '夏の想い出がまわる',
            //     },
            //     {
            //         time: 60,
            //         text: 'こんなとこにあるはずもないのに',
            //     },
            //     {
            //         time: 75,
            //         text: '终わり',
            //     },
            // ],
        })

        // Load the initial route selection immediately after the player is created.
        if (videoId.value) {
            void loadVideoFileByIndex(Number(route.params.index))
        }

        art.value.on('video:ended', () => {
            if (videoStateStore.autoPlay && videoStateStore.videoFileList.length > 1 && Number(route.params.index) < videoStateStore.videoFileList.length) {
                router.push({
                    name: "video",
                    params: {
                        videoId: route.params.videoId,
                        index: Number(route.params.index) + 1
                    }
                })
            }
        })

        art.value.on('destroy', () => {
            if (playlistBlobUrl) {
                URL.revokeObjectURL(playlistBlobUrl)
                playlistBlobUrl = ''
            }
        })
    }

    /** print the current Artplayer instance */
    function getInstance() {
        console.log(art.value)
    }

    // watch for detecting video file changes to load new source from backend
    watch(
        () => [route.params.videoId, route.params.index],
        ([nextVideoId, nextIndex]) => {
            if (!nextVideoId || !art.value) {
                return
            }
            void loadVideoFileByIndex(Number(nextIndex))
        }
    )

    // watch for loading video cover
    watch(
        () => videoStateStore.videoInfo.videoCover,
        (videoCover) => {
            loadCover(videoCover)
        },
        { immediate: true }
    )



    return {
        art,
        playerHeight,
        style,
        $container,
        videoStateStore,
        initArt,
        getInstance,
        loadRemote,
        loadVideoFileByIndex,
    }
}