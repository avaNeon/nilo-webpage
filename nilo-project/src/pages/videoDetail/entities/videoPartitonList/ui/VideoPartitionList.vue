<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { useVideoFile } from '../model/useVideoFile';
import { calculateDuration } from '@/shared/utils/DateUtil';
import useVideoStateStore from "@/pages/videoDetail/store/VideoStateStore";
import { useRoute } from 'vue-router';

const { loadVideoFileList, selectVideo } = useVideoFile();

const videoStateStore = useVideoStateStore()
const route = useRoute()

// 当前播放的是第几P（从 1 开始）
const currentIndex = computed(() => Number(route.params.index) || 1)

onMounted(() => {
    loadVideoFileList()
})
</script>

<template>
    <div class="video-list-panel" v-if="videoStateStore.videoFileList && videoStateStore.videoFileList.length > 1">
        <div class="top-bar">
            <div class="top-left">
                <span class="card-dot"></span>
                <span class="description-text">选集</span>
                <span class="list-count">({{ currentIndex }}/{{ videoStateStore.videoFileList.length }})</span>
            </div>
            <div class="top-right">
                <span class="autoplay-text">自动连播</span>
                <el-switch v-model="videoStateStore.autoPlay" size="small" aria-label="自动连播" />
            </div>
        </div>
        <el-scrollbar class="scroll-list" :max-height="600">
            <div class="partition-list">
                <button type="button" v-for="(item, index) in videoStateStore.videoFileList" :key="index"
                    :class="['video-item', { active: index === currentIndex - 1 }]" :title="item.fileName"
                    @click="selectVideo(index + 1)">
                    <span class="inline-left">
                        <span v-if="index === currentIndex - 1" class="playing-dot"></span>
                        <span class="part-number">P{{ index + 1 }}</span>
                        <span class="title">{{ item.fileName }}</span>
                    </span>
                    <span class="duration">{{ calculateDuration(item.duration) }}</span>
                </button>
            </div>
        </el-scrollbar>
    </div>
</template>

<style lang="scss" scoped>
.video-list-panel {
    width: 100%;
    border-radius: 18px;
    background: $warm-card;
    box-shadow: $warm-shadow-ring;
    overflow: hidden;

    .top-bar {
        height: 52px;
        padding: 0 18px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        border-bottom: 1px solid $warm-line;

        .top-left {
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 0;
            white-space: nowrap;

            .card-dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                flex-shrink: 0;
                background: $warm-accent;
            }

            .description-text {
                font-size: 15px;
                font-weight: 600;
                color: $warm-ink;
            }

            .list-count {
                margin-left: -4px;
                font-size: 13px;
                font-weight: 500;
                color: $warm-ink-4;
            }
        }

        .top-right {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;

            .autoplay-text {
                font-size: 12px;
                color: $warm-ink-3;
            }
        }
    }

    .partition-list {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 8px;

        .video-item {
            width: 100%;
            padding: 8px 12px;
            border: none;
            border-radius: 10px;
            background: transparent;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            font-size: 13px;
            text-align: left;
            color: $warm-ink-2;
            cursor: pointer;
            transition: background-color 0.2s, color 0.2s;

            &:hover {
                background: $warm-paper;
                color: $warm-ink;
            }

            &:focus-visible {
                outline: 2px solid rgba(26, 25, 22, 0.2);
                outline-offset: -2px;
            }

            &.active {
                background: $warm-paper;
                color: $warm-accent-text;
                font-weight: 500;

                .part-number,
                .duration {
                    color: inherit;
                }
            }

            .inline-left {
                display: flex;
                align-items: center;
                gap: 8px;
                min-width: 0;

                .playing-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    flex-shrink: 0;
                    background: $warm-accent;
                }

                .part-number {
                    flex-shrink: 0;
                    font-family: $warm-font-mono;
                    font-size: 12px;
                    color: $warm-ink-4;
                }

                .title {
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
            }

            .duration {
                flex-shrink: 0;
                font-size: 12px;
                color: $warm-ink-4;
            }
        }
    }
}
</style>
