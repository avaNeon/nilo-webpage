<script lang="ts" setup>
import pulseLoading from '@/assets/pulse_loading.svg';
import { onMounted } from 'vue';
import { useVideoFile } from '../model/useVideoFile';
import { calculateDuration } from '@/shared/utils/DateUtil';
import useVideoStateStore from "@/pages/videoDetail/store/VideoStateStore";
import { useRoute } from 'vue-router';

const { loadVideoFileList, selectVideo } = useVideoFile();

const videoStateStore = useVideoStateStore()
const route = useRoute()

onMounted(() => {
    loadVideoFileList()
})
</script>

<template>
    <div class="video-list-panel" v-if="videoStateStore.videoFileList && videoStateStore.videoFileList.length > 1">
        <div class="top-bar">
            <div class="top-left">
                <span class="description-text">视频选集</span>
                <span class="list-count">{{ Number(route.params.index) || 1 }}/{{ videoStateStore.videoFileList?.length }}</span>
            </div>
            <div class="top-right">
                <el-switch v-model="videoStateStore.autoPlay" inactive-text="自动连播" />
            </div>
        </div>
        <div class="partition-list">
            <el-scrollbar class="scroll-list" :max-height="600">
                <div :class="['video-item', index === (Number(route.params.index) || 1) - 1 ? 'active' : '']"
                    v-for="(item, index) in videoStateStore.videoFileList" @click="selectVideo(index + 1)">
                    <div class="inline-left">
                        <div class="playing-icon" v-if="index === (Number(route.params.index) || 1) - 1">
                            <img class="icon" :src="pulseLoading" alt="playing" />
                        </div>
                        <div class="title" :title="item.fileName">
                            {{ `P${index + 1} ${item.fileName}` }}
                        </div>
                    </div>
                    <div class="inline-right">
                        <div class="duration">
                            {{ calculateDuration(item.duration) }}
                        </div>
                    </div>
                </div>
            </el-scrollbar>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.video-list-panel {
    width: 100%;
    max-height: 100%;
    background-color: #f0eded;
    border-radius: 10px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);


    // ↓ has been included in html, but keep it here for better readability
    // display: flex;
    flex-direction: column;

    .top-bar {
        height: 50px;
        line-height: 50px;

        border-radius: 5px;
        padding: 10px 15px;

        display: flex;
        justify-content: space-between;
        align-items: center;

        .top-left {

            display: flex;
            column-gap: 5px;
            align-items: center;

            .description-text {
                font-size: 16px;
                font-weight: 500;
            }

            .list-count {
                font-size: 14px;
                color: rgb(150, 150, 150);
            }
        }

        .top-left,
        .top-right {
            text-wrap: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    }

    .partition-list {
        margin: 0 10px;

        .scroll-list {
            padding: 10px 0;

            .video-item {
                padding: 10px 15px;

                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: pointer;

                &.active {
                    background-color: white;
                }

                &:hover,
                &.active {

                    .inline-left {

                        .title {
                            color: $color-bilibili-blue;
                            font-size: 15px;
                            font-weight: 500;
                        }
                    }
                }

                .inline-left {
                    display: flex;
                    column-gap: 10px;
                    align-items: center;

                    .playing-icon {
                        height: 20px;
                        width: 20px;

                        .icon {
                            height: 20px;
                            width: 20px;
                        }
                    }

                    .title {
                        transition: all 0.4s ease;
                        font-size: 14px;
                    }
                }

                .inline-right {
                    display: flex;
                    column-gap: 10px;
                    align-items: center;

                    .duration {
                        font-size: 14px;
                        color: rgb(150, 150, 150);
                    }
                }

                .inline-left,
                .inline-right {
                    text-wrap: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
            }
        }
    }
}
</style>