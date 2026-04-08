<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { usePlayer } from '../model/usePlayer';

const { art, playerHeight, style, videoStateStore, initArt } = usePlayer()

const watcher = ref(0)
const danmakuNumber = ref(0)

const showDanmaku = ref(true)


onMounted(() => {
    initArt()
})

onBeforeUnmount(() => {
    art.value?.destroy(false)
})
</script>

<template>
    <div :class="['player-panel', videoStateStore.displayMode]">
        <div class="content" :style="{
            height: playerHeight + 'px',
            width: style.width
        }">
            <div ref="$container" :style="style" />
            <div class="danmaku-panel">
                <div class="watching-danmaku-info">
                    {{ watcher }}人在看，已装填{{ danmakuNumber }}条弹幕
                </div>
                <div id="danmaku" class="danmaku" v-show="showDanmaku"></div>
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

.player-panel>.left>.danmaku-panel>.danmaku>.artplayer-plugin-danmuku {
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
</style>