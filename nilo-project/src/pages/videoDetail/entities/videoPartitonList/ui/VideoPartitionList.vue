<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useVideoFile } from '../model/useVideoFile';
import { calculateDuration } from '@/shared/utils/DateUtil';
import useVideoStateStore from "@/pages/videoDetail/store/VideoStateStore";
import { useRoute } from 'vue-router';

const { loadVideoFileList, selectVideo } = useVideoFile();

const videoStateStore = useVideoStateStore()
const route = useRoute()

// 当前播放的是第几P（从 1 开始）
const currentIndex = computed(() => Number(route.params.index) || 1)

const fileCount = computed(() => videoStateStore.videoFileList?.length ?? 0)

const open = ref(true)

/** 列表底部的提示：下一P是哪个 / 自动连播关着 */
const autoPlayHint = computed(() =>
{
    if (!videoStateStore.autoPlay)
    {
        return '自动连播已关闭'
    }
    return currentIndex.value < fileCount.value ? `播完后自动播放 P${currentIndex.value + 1}` : '已经是最后一P'
})

function toggleAutoPlay()
{
    videoStateStore.setAutoPlay(!videoStateStore.autoPlay)
}

onMounted(() => {
    loadVideoFileList()
})
</script>

<template>
    <!-- 蓝色卡片：分P列表 + 自动连播开关 -->
    <div v-if="fileCount > 1" :class="['video-list-panel', { open }]">
        <div class="top-bar">
            <button type="button" class="title-button" :aria-expanded="open" @click="open = !open">
                <span class="description-text">视频分P</span>
                <span class="list-count">{{ currentIndex }} / {{ fileCount }}</span>
            </button>
            <span class="spacer"></span>
            <button type="button" class="autoplay" role="switch" :aria-checked="videoStateStore.autoPlay"
                @click="toggleAutoPlay">
                自动连播
                <span :class="['switch-track', { on: videoStateStore.autoPlay }]">
                    <span class="switch-knob"></span>
                </span>
            </button>
            <button type="button" class="chevron-button" :aria-label="open ? '收起分P列表' : '展开分P列表'"
                @click="open = !open">
                <span class="chevron"></span>
            </button>
        </div>
        <div v-show="open" class="list-body">
            <el-scrollbar class="scroll-list" :max-height="480">
                <div class="partition-list">
                    <button type="button" v-for="(item, index) in videoStateStore.videoFileList" :key="index"
                        :class="['video-item', { active: index === currentIndex - 1 }]" :title="item.fileName"
                        @click="selectVideo(index + 1)">
                        <span class="part-number">P{{ index + 1 }}</span>
                        <span class="title">{{ item.fileName }}</span>
                        <span class="duration">{{ index === currentIndex - 1 ? '播放中' :
                            calculateDuration(item.duration) }}</span>
                    </button>
                </div>
            </el-scrollbar>
            <span class="autoplay-hint">{{ autoPlayHint }}</span>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.video-list-panel {
    width: 100%;
    border-radius: 24px;
    background: $warm-accent;
    color: #FFFFFF;

    button {
        padding: 0;
        border: none;
        background: transparent;
        font: inherit;
        color: inherit;
        cursor: pointer;

        &:focus-visible {
            outline: 2px solid #FFFFFF;
            outline-offset: 2px;
        }
    }

    .top-bar {
        height: 60px;
        padding: 0 16px 0 20px;
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .title-button {
        display: flex;
        align-items: center;
        gap: 10px;
        white-space: nowrap;
    }

    .description-text {
        font-size: 15px;
        font-weight: 700;
    }

    .list-count {
        font-size: 12px;
        color: $warm-accent-on-dark;
    }

    .spacer {
        flex: 1;
    }

    // 自动连播：白色轨道 + 蓝色圆钮（开），半透明轨道 + 白色圆钮（关）
    .autoplay {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: $warm-accent-on-dark-2;
        white-space: nowrap;
    }

    .switch-track {
        position: relative;
        width: 34px;
        height: 20px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.28);
        transition: background-color 0.2s;

        .switch-knob {
            position: absolute;
            left: 3px;
            top: 3px;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #FFFFFF;
            transition: left 0.2s, background-color 0.2s;
        }

        &.on {
            background: #FFFFFF;

            .switch-knob {
                left: 17px;
                background: $warm-accent;
            }
        }
    }

    .chevron-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 50%;
    }

    .chevron {
        width: 8px;
        height: 8px;
        border-right: 1.5px solid #FFFFFF;
        border-bottom: 1.5px solid #FFFFFF;
        transform: translateY(2px) rotate(-135deg);
        transition: transform 0.2s;
    }

    &.open .chevron {
        transform: translateY(-2px) rotate(45deg);
    }

    .list-body {
        padding: 0 10px 14px;
    }

    .partition-list {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .video-item {
        display: grid;
        grid-template-columns: 34px minmax(0, 1fr) auto;
        gap: 10px;
        align-items: center;
        width: 100%;
        height: 48px;
        padding: 0 12px;
        border-radius: 14px;
        text-align: left;
        transition: background-color 0.2s;

        &:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        &:focus-visible {
            outline-offset: -2px;
        }

        .part-number,
        .duration {
            font-family: $warm-font-mono;
            font-size: 12px;
            color: $warm-accent-on-dark;
        }

        .title {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 14px;
            font-weight: 500;
        }

        // 正在播放：白底蓝字
        &.active {
            background: #FFFFFF;
            color: $warm-accent;

            .part-number,
            .duration {
                color: inherit;
            }

            .title {
                font-weight: 700;
            }
        }
    }

    .autoplay-hint {
        display: block;
        padding: 10px 12px 0;
        font-size: 12px;
        color: $warm-accent-on-dark-2;
    }
}
</style>
