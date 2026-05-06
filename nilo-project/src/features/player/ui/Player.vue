<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { usePlayer } from '../model/usePlayer';
import { useDanmakuStore } from '../store/DanmakuStore';

const { playerHeight, style, videoStateStore, watcherCount, initArt, startTimer, cleanup } = usePlayer()
const danmakuStore = useDanmakuStore()

const showDanmaku = ref(true)

const props = withDefaults(defineProps<{
    danmakuAvailable: boolean
}>(), {
})

onMounted(() =>
{
    initArt()
    startTimer()
    // 在 html 元素上设置 data 属性，为网页全屏场景提供 CSS 锚点
    // 放到 onMounted 而非 watch，避免全屏切换期间 DOM 突变导致 Fullscreen API 取消
    if (!props.danmakuAvailable)
    {
        document.documentElement.setAttribute('data-danmaku-unavailable', '')
    }
})

onBeforeUnmount(() =>
{
    cleanup()
    document.documentElement.removeAttribute('data-danmaku-unavailable')
})
</script>

<template>
    <div :class="['player-panel', videoStateStore.displayMode, { 'danmaku-unavailable': !danmakuAvailable }]">
        <div class="content" :style="{
            height: playerHeight + 'px',
            width: style.width
        }">
            <div ref="$container" :style="style" />
            <div class="danmaku-panel">
                <div class="watching-danmaku-info">
                    {{ watcherCount }}人在看，已装填{{ danmakuStore.danmakuList.length }}条弹幕
                </div>
                <div id="danmaku"
                    :class="['danmaku', { 'danmaku-disabled': !danmakuStore.danmakuEnabled || !danmakuAvailable }]"
                    v-show="showDanmaku"></div>
            </div>
            <div id="play" class="play">
                <img class="play-icon" src="@/assets/play.svg" alt="pause" />
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.player-panel {
    .content {
        border-radius: 10px;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
        transition: all 0.4s ease;

        .danmaku-panel {
            padding: 10px 15px;

            display: flex;
            justify-content: space-between;
            align-items: center;

            .watching-danmaku-info {
                font-size: 14px;
            }

            .danmaku {
                margin-left: 20px;
                flex: 1;
            }
        }

        .play {
            .play-icon {
                width: 80px;
                height: 80px;
            }
        }
    }
}
</style>

<style lang="scss">
$icon-height: 30px;

.player-panel>.content>.danmaku-panel>.danmaku>.artplayer-plugin-danmuku {
    .apd-toggle.hint--rounded.hint--top {
        .apd-icon.apd-toggle-on {
            height: $icon-height;
        }
    }

    .apd-emitter {
        height: 40px;

        .apd-send {
            font-size: 14px;
            font-weight: 400;
        }

        .apd-style {
            .apd-icon.apd-style-icon {
                height: $icon-height;
            }
        }
    }
}

// 当弹幕被关闭时，禁用发送框（非全屏场景）
.danmaku.danmaku-disabled .artplayer-plugin-danmuku .apd-emitter {
    pointer-events: none;
    opacity: 0.5;

    .apd-input {
        background-color: #f5f5f5;
        color: #999;
        padding-left: 8px !important;
        text-indent: 0 !important;
    }

    .apd-send {
        background-color: #e0e0e0;
        color: #999;
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
