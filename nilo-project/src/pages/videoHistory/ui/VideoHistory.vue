<script lang="ts" setup>
import { inject } from 'vue'
import IndexHeader from '@/shared/widgets/indexHeader/ui/IndexHeader.vue'
import defaultBg from '@/assets/banner-background-beach.jpg'
import { BODY_PADDING } from '@/shared/config/Config'
import VideoItem from '@/shared/entities/videoItem/ui/VideoItem.vue'
import { useVideoHistory } from '../composables/useVideoHistory'
import wrongSrc from '@/assets/icon/img/wrong.svg'

// 获取内容部分最大最小宽度
const mainContentMaxWidth: number = inject('mainContentMaxWidth', 0)
const mainContentMinWidth: number = inject('mainContentMinWidth', 0)

const {
    historyItemMap,
    loading,
    finished,
    deleting,
    deleteHistoryItem,
    deleteAllHistory,
    getTimelineDayLabel,
} = useVideoHistory()
</script>

<template>
    <div class="page-content" :style="{
        'max-width': mainContentMaxWidth + 'px',
        'min-width': mainContentMinWidth + 'px',
    }">
        <header>
            <div class="header" :style="{
                'background-image': `url(${defaultBg})`
            }">
                <IndexHeader />
            </div>
        </header>
        <div class="content" :style="{
            'margin-left': BODY_PADDING,
            'margin-right': BODY_PADDING,
        }">
            <div class="title-row">
                <div class="page-title">历史记录</div>
                <el-button type="danger" round :disabled="historyItemMap.size === 0" :loading="deleting"
                    @click="deleteAllHistory">
                    清空全部
                </el-button>
            </div>
            <el-empty v-if="!loading && historyItemMap.size === 0" description="暂无历史记录" />
            <el-timeline v-else class="history-timeline">
                <el-timeline-item v-for="[date, items] in historyItemMap" :key="date"
                    :timestamp="`${getTimelineDayLabel(date)} · ${date}`"
                    placement="top">
                    <div class="history-list">
                        <div v-for="item in items"
                            :key="`${item.history.videoId}-${item.history.fileIndex}-${item.history.lastUpdateTime}`"
                            class="history-item">
                            <button class="delete-history-button"
                                :disabled="deleting"
                                title="删除历史记录" @click.stop="deleteHistoryItem(item.history)">
                                <img :src="wrongSrc" alt="删除历史记录">
                            </button>
                            <VideoItem class="history-video-item" :video-info="item.videoInfo" type="horizontal"
                                date-description="观看于 " :date="item.history.lastUpdateTime" :show-stats="false"
                                :show-duration="false" :file-index="item.history.fileIndex" />
                        </div>
                    </div>
                </el-timeline-item>
            </el-timeline>
            <div v-if="historyItemMap.size > 0" class="load-more">
                <span>{{ loading ? '加载中...' : finished ? '没有更多了' : '继续向下滚动加载更多' }}</span>
            </div>
        </div>
    </div>
</template>

<style>
body {
    background-color: rgb(197, 197, 197) !important;
}
</style>

<style lang="scss" scoped>
.page-content {
    position: relative;
    min-height: 100vh;
    background-color: white;
    margin: 0 auto;

    header {
        width: 100%;
        position: relative;

        .header {
            height: 150px;
            background: no-repeat center;
            background-size: cover;
        }
    }

    .content {
        background-color: white;
        padding: 28px 0 48px;

        .title-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;

            .page-title {
                font-size: 24px;
                font-weight: 600;
                color: $color-text-primary;
            }
        }

        .history-timeline {
            padding-left: 4px;

            .history-list {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                gap: 18px;
            }

            .history-item {
                position: relative;
                height: 220px;

                &:hover {
                    .delete-history-button {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                .delete-history-button {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    z-index: 200;
                    width: 26px;
                    height: 26px;
                    border: none;
                    border-radius: 50%;
                    background-color: rgba(0, 0, 0, 0.55);
                    cursor: pointer;
                    opacity: 0;
                    transform: scale(0.9);
                    transition: opacity 0.2s ease, transform 0.2s ease, background-color 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0;

                    img {
                        width: 14px;
                        height: 14px;
                        display: block;
                    }

                    &:hover {
                        background-color: rgba(245, 108, 108, 0.95);
                    }

                    &:disabled {
                        cursor: not-allowed;
                        opacity: 0.7;
                    }
                }

                .history-video-item {
                    height: 100%;
                }
            }
        }

        .load-more {
            display: flex;
            justify-content: center;
            margin-top: 24px;
        }
    }
}
</style>
