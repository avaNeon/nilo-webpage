<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';
import { usePlayer } from '../model/usePlayer';
import { useDanmakuStore } from '../store/DanmakuStore';

const { art, style, videoStateStore, watcherCount, initArt, startTimer, cleanup } = usePlayer()
const danmakuStore = useDanmakuStore()

const showDanmaku = ref(true)

const props = withDefaults(defineProps<{
    danmakuAvailable: boolean
}>(), {
})

// 播放区域尺寸变化（剧场模式切换、窗口缩放）时通知 Artplayer 重新布局
const videoAreaEl = useTemplateRef<HTMLDivElement>('videoArea')
let resizeObserver: ResizeObserver | null = null
let resizeFrame = 0

function observeVideoArea()
{
    const el = videoAreaEl.value
    if (!el || typeof ResizeObserver === 'undefined') return
    // observe 后会立即回调一次初始尺寸，跳过
    let initial = true
    resizeObserver = new ResizeObserver(() =>
    {
        if (initial)
        {
            initial = false
            return
        }
        cancelAnimationFrame(resizeFrame)
        resizeFrame = requestAnimationFrame(() =>
        {
            art.value?.emit('resize')
        })
    })
    resizeObserver.observe(el)
}

onMounted(() =>
{
    initArt()
    startTimer()
    observeVideoArea()
    // 在 html 元素上设置 data 属性，为网页全屏场景提供 CSS 锚点
    // 放到 onMounted 而非 watch，避免全屏切换期间 DOM 突变导致 Fullscreen API 取消
    if (!props.danmakuAvailable)
    {
        document.documentElement.setAttribute('data-danmaku-unavailable', '')
    }
})

onBeforeUnmount(() =>
{
    resizeObserver?.disconnect()
    resizeObserver = null
    cancelAnimationFrame(resizeFrame)
    cleanup()
    document.documentElement.removeAttribute('data-danmaku-unavailable')
})
</script>

<template>
    <div :class="['player-panel', videoStateStore.displayMode, { 'danmaku-unavailable': !danmakuAvailable }]">
        <div ref="videoArea" class="video-area">
            <div ref="$container" :style="style" />
        </div>
        <div class="danmaku-panel">
            <div class="watching-danmaku-info">
                {{ watcherCount }} 人在看 · 已装填 {{ danmakuStore.danmakuList.length }} 条弹幕
            </div>
            <div id="danmaku"
                :class="['danmaku', { 'danmaku-disabled': !danmakuStore.danmakuEnabled || !danmakuAvailable }]"
                v-show="showDanmaku"></div>
        </div>
        <!-- 中间的大播放键，交给 Artplayer 当 state 图标；样式在下方 .nilo-player -->
        <div id="play" class="play">
            <span class="play-circle"><span class="play-triangle"></span></span>
        </div>
    </div>
</template>

<style lang="scss" scoped>
// 顶栏 + 弹幕栏 + 上下留白，剧场模式下视频区域不超出一屏
$theater-max-height: calc(100vh - #{$warm-header-height} - 56px - 56px);

.player-panel {
    // 视频区域 + 弹幕栏合成一张卡片；弹幕设置面板向上弹出，仍在卡片内部
    // 卡片本身不裁剪、不铺底色：圆角裁剪会让黑底从抗锯齿边缘透出来，在浅色画面的上方两角看着像一圈黑边
    // 所以圆角分别交给视频区域（clip-path 整体裁剪）和弹幕栏（自带白底）
    border-radius: 28px;

    .video-area {
        position: relative;
        width: 100%;
        aspect-ratio: 16 / 9;
        min-height: 0;
        clip-path: inset(0 round 28px 28px 0 0);

        // 黑底往里收 1px（圆角同步缩小），不垫在视频边缘下面：视频是单独合成的一层，
        // 播放器宽度又常带小数像素，边缘抗锯齿时会把下面的黑底透出来，
        // 在浅色画面的两个上角和左右两边就是一圈黑细线；收进去之后边缘下面是页面白底
        &::before {
            content: '';
            position: absolute;
            inset: 1px;
            border-radius: 27px 27px 0 0;
            background: #000;
        }
    }

    &.theater .video-area {
        // 保持 16:9，超出一屏时限制高度，左右留黑边
        max-height: $theater-max-height;
    }

    .danmaku-panel {
        height: 56px;
        padding: 0 10px 0 22px;
        display: flex;
        align-items: center;
        gap: 20px;
        border-radius: 0 0 28px 28px;
        background: $warm-card;
        // 白底页面上靠一圈内描边勾出弹幕栏
        box-shadow: $warm-shadow-ring;

        .watching-danmaku-info {
            flex-shrink: 0;
            font-size: 13px;
            color: $warm-ink-4;
            white-space: nowrap;
        }

        .danmaku {
            flex: 1;
            min-width: 0;
        }
    }

}
</style>

<style lang="scss">
$icon-height: 30px;

// 普通模式下 Artplayer 自己不铺黑底，黑底交给上面的 .video-area::before；原生全屏时照旧
.player-panel .video-area .art-video-player:not(.art-fullscreen) {
    background-color: transparent;
}

// ==================== 播放器控件配色（A5「深色蒙层」） ====================
// 电光蓝放在黑色蒙层上看不清：进度条、音量条改成白色，拖动圆点用蓝色加白圈，
// 设置面板的选中项用浅一档的蓝（Artplayer 的 theme 选项，见 usePlayer）
.nilo-player {
    --art-progress-color: rgba(255, 255, 255, 0.32);
    --art-loaded-color: rgba(255, 255, 255, 0.28);
    --art-hover-color: rgba(255, 255, 255, 0.28);
    --art-indicator-size: 14px;
    --art-state-size: 64px;

    // 已播放部分读的是主题色变量，只在进度条和音量条里换成白色
    .art-progress,
    .art-volume-panel {
        --art-theme: #FFFFFF;
    }

    .nilo-progress-knob,
    .art-volume-indicator {
        box-shadow: 0 0 0 3px #FFFFFF, 0 2px 8px rgba(11, 12, 18, 0.35);
    }

    .nilo-progress-knob {
        display: block;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: $warm-accent;
    }

    .art-volume-indicator {
        --art-theme: #{$warm-accent};
    }

    // 底部渐变换成墨色；控件收起只剩迷你进度条时保持 Artplayer 原样（不铺渐变）
    &.art-video-player:not(.art-mini-progress-bar):not(.art-lock) .art-bottom {
        background-image: linear-gradient(to top, rgba(11, 12, 18, 0.78), rgba(11, 12, 18, 0.34), transparent);
    }

    // 中间的大播放键：白色圆底 + 蓝色三角，亮暗画面上都显眼
    .play-circle {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 64px;
        height: 64px;
        padding-left: 5px;
        border-radius: 50%;
        background: #FFFFFF;
        box-shadow: 0 10px 30px -10px rgba(11, 12, 18, 0.5);
    }

    .play-triangle {
        width: 0;
        height: 0;
        border-left: 16px solid $warm-accent;
        border-top: 10px solid transparent;
        border-bottom: 10px solid transparent;
    }
}

// 弹幕发送栏（非全屏时挂在卡片底部的 #danmaku 上）
.player-panel>.danmaku-panel>.danmaku>.artplayer-plugin-danmuku {
    height: 40px;
    gap: 14px;

    .apd-icon {
        fill: $warm-ink-3;
    }

    .apd-toggle.hint--rounded.hint--top {
        .apd-icon.apd-toggle-on {
            height: $icon-height;
        }
    }

    // 浅灰胶囊输入框，聚焦时换白底 + 蓝色描边
    .apd-emitter {
        height: 40px;
        padding: 0 4px 0 8px;
        background-color: $warm-sunken;
        border: none;
        border-radius: 999px;
        transition: background-color 0.2s, box-shadow 0.2s;

        &:focus-within {
            background-color: #FFFFFF;
            box-shadow: inset 0 0 0 1.5px $warm-accent;
        }

        .apd-input {
            padding-left: 6px;
            font-size: 13px;
            color: $warm-ink;

            &::placeholder {
                color: $warm-ink-4;
            }
        }

        .apd-send {
            height: 32px;
            width: 64px;
            border-radius: 999px;
            background-color: $warm-ink;
            color: #FFFFFF;
            font-size: 12px;
            font-weight: 600;
            transition: background-color 0.2s;

            &:hover {
                background-color: $warm-accent;
            }

            &.apd-lock {
                background-color: $warm-sunken;
                color: $warm-ink-4;
            }
        }

        .apd-style {
            .apd-icon.apd-style-icon {
                height: $icon-height;
            }
        }
    }

    // 弹出面板：墨色底 + 蓝色选中态
    .apd-config-panel-inner,
    .apd-style-panel-inner {
        border-radius: 12px;
        background-color: rgba(11, 12, 18, 0.92);
        color: #FFFFFF;
    }

    .apd-modes .apd-mode:hover,
    .apd-config-other .apd-other:hover {
        color: $warm-accent-on-dark;
    }

    .apd-slider .apd-slider-progress,
    .apd-slider .apd-slider-dot {
        background-color: $warm-accent;
    }
}

// 当弹幕被关闭时，禁用发送框（非全屏场景）
// 选择器要比上面的暖色发送栏样式更具体，才能盖住它的背景色
.player-panel>.danmaku-panel>.danmaku.danmaku-disabled>.artplayer-plugin-danmuku .apd-emitter {
    pointer-events: none;
    opacity: 0.5;

    .apd-input {
        background-color: $warm-sunken;
        color: $warm-ink-4;
        padding-left: 8px !important;
        text-indent: 0 !important;
    }

    .apd-send {
        background-color: $warm-sunken;
        color: $warm-ink-4;
    }
}

// 当弹幕不可用 (danmakuAvailable=false) 时的样式
// .player-panel.danmaku-unavailable 覆盖正常模式 + 浏览器全屏
// [data-danmaku-unavailable] 覆盖网页全屏（ArtPlayer CSS fullscreen 下控件可能脱离 .player-panel 层级）
.player-panel.danmaku-unavailable .artplayer-plugin-danmuku,
[data-danmaku-unavailable] .artplayer-plugin-danmuku {
    .apd-toggle {
        display: none !important;
    }

    .apd-style {
        display: none !important;
    }

    .apd-emitter {
        pointer-events: none;
        opacity: 0.5;

        .apd-input {
            padding-left: 8px !important;
            text-indent: 0 !important;
        }
    }

    // 用 visibility 而非 display:none，避免容器高度坍塌触发 resize → 全屏退出
    .apd-danmuku {
        visibility: hidden !important;
    }
}

// 在原生全屏（浏览器全屏）下隐藏网页全屏按钮，避免用户进行有闪烁问题的切换路径
// 参考 B 站做法：全屏时不显示"退出网页全屏"按钮
.player-panel .art-fullscreen .art-control-fullscreenWeb {
    display: none !important;
}
</style>
