<script lang="ts" setup>
import SerieItem from '@/pages/userHome/shared/ui/SerieItem.vue';
import { useHomeVideoSeries } from '../composables/useHomeVideoSeries';
import VideoItem from '@/shared/entities/videoItem/ui/VideoItem.vue';
import noneSrc from "@/assets/icon/img/none.svg"
import { VueDraggable } from 'vue-draggable-plus';
import VideoSeriesEditor from '@/pages/userHome/features/videoSeriesEditor/ui/VideoSeriesEditor.vue';
import { useRoute } from 'vue-router';
import deleteSrc from '@/assets/icon/img/delete.svg'


const route = useRoute()

const {
    maxSeriesNumber,
    maxVideosNumber,
    isMySelf,
    seriesList,
    hasSeries,
    canDrag,
    dragging,
    dialogVisible,
    viewSerieMode,
    currentSerieInfo,
    videoList,
    videoCount,
    draggingTmpVideoList,
    draggingTmpSeriesList,
    resortSeries,
    resortSeriesVideos,
    deleteSeries,
    deleteSeriesVideo,
    saveSerie,
    startDragging,
    endDragging,
} = useHomeVideoSeries()

function getSerieRoute(seriesId: string | null | undefined)
{
    return {
        name: 'userVideoSeries',
        params: {
            userId: route.params.userId,
            seriesId,
        },
    }
}

</script>

<template>
    <div class="content">
        <VideoSeriesEditor :visible="dialogVisible" :series-id="currentSerieInfo?.seriesId ?? undefined"
            :title="currentSerieInfo?.seriesName ?? undefined"
            :description="currentSerieInfo?.seriesDescription ?? undefined"
            :existed-video-list="videoList.map(videoInfo => videoInfo.videoId) as string[]"
            :max-videos-number="maxVideosNumber" @update:visible="newVal => dialogVisible = newVal"
            @submit="saveSerie" />
        <div class="top-bar">
            <div v-if="!viewSerieMode">
                <div class="label">
                    <span class="title">系列</span>
                    <span class="capacity">({{ seriesList.length }}/{{ maxSeriesNumber }})</span>
                    <button class="host-hint" v-if="canDrag && !dragging && seriesList.length > 1"
                        @click="startDragging">排序</button>
                    <button class="host-hint cancel" v-if="dragging" @click="endDragging">取消</button>
                    <button class="host-hint confirm" v-if="dragging" @click="resortSeries">确定</button>
                </div>
            </div>
            <div v-else>
                <div class="label">
                    <span class="title">{{ currentSerieInfo?.seriesName }}</span>
                    <span class="capacity">({{ videoCount }}/{{ maxVideosNumber }})</span>
                    <span class="host-hint" v-if="canDrag && !dragging && videoCount > 1"
                        @click="startDragging">排序</span>
                    <button class="host-hint cancel" v-if="dragging" @click="endDragging">取消</button>
                    <button class="host-hint confirm" v-if="dragging" @click="resortSeriesVideos">确定</button>
                </div>
                <div class="serie-description">
                    {{ currentSerieInfo?.seriesDescription }}
                </div>
            </div>
        </div>
        <div class="main-content">
            <div v-if="!viewSerieMode" class="series-list">
                <!-- 存在数据 -->
                <template v-if="hasSeries || isMySelf">
                    <!-- 编辑模式 -->
                    <VueDraggable v-if="dragging" v-model="draggingTmpSeriesList" class="series-items"
                        draggable=".serie-drag-item" :animation="180" ghost-class="serie-item-ghost"
                        chosen-class="serie-item-chosen" drag-class="serie-item-dragging">
                        <div v-for="(serieItem, index) in draggingTmpSeriesList" :key="serieItem.seriesId ?? index"
                            class="serie-link serie-drag-item">
                            <SerieItem class="serie-item" :videoSeriesInfo="serieItem" />
                        </div>
                    </VueDraggable>
                    <!-- 浏览模式 -->
                    <div v-else class="series-items">
                        <button v-if="canDrag" class="serie-add-item" type="button" @click="dialogVisible = true">
                            <span class="add-icon">+</span>
                            <span class="add-text">添加系列</span>
                        </button>
                        <div v-for="(serieItem, index) in seriesList" :key="serieItem.seriesId ?? index"
                            class="serie-card">
                            <RouterLink class="serie-link" :to="getSerieRoute(serieItem.seriesId)">
                                <SerieItem class="serie-item" :videoSeriesInfo="serieItem" />
                            </RouterLink>
                            <button v-if="isMySelf" class="delete-action" type="button"
                                @click="deleteSeries(serieItem.seriesId)">
                                <img :src="deleteSrc" alt="del">
                            </button>
                        </div>
                    </div>
                </template>
                <!-- 不存在数据 -->
                <div v-else class="no-data">
                    <img :src="noneSrc" alt="none">
                    <span>此用户暂时没有创建系列</span>
                </div>
            </div>
            <div v-else ref="videosListRef" class="videos-list">
                <!-- 存在数据 -->
                <template v-if="videoCount !== 0 || isMySelf">
                    <!-- 编辑模式 -->
                    <VueDraggable v-if="dragging" v-model="draggingTmpVideoList" class="video-items"
                        draggable=".video-item" :animation="180" ghost-class="video-item-ghost"
                        chosen-class="video-item-chosen" drag-class="video-item-dragging">
                        <div class="video-item" v-for="(videoItem, index) in draggingTmpVideoList"
                            :key="videoItem.videoId ?? index">
                            <VideoItem class="item" :video-info="videoItem" type="horizontal" />
                        </div>
                    </VueDraggable>
                    <!-- 浏览模式 -->
                    <div v-else class="video-items">
                        <button v-if="canDrag" class="serie-add-item" type="button" @click="dialogVisible = true">
                            <span class="modify-icon">+</span>
                            <span class="modify-text">修改系列 & 添加视频</span>
                        </button>
                        <div class="video-item" v-for="(videoItem, index) in videoList"
                            :key="videoItem.videoId ?? index">
                            <VideoItem class="item" :video-info="videoItem" type="horizontal" />
                            <button v-if="isMySelf" class="delete-action" type="button"
                                @click="deleteSeriesVideo(videoItem.videoId)">
                                <img :src="deleteSrc" alt="del">
                            </button>
                        </div>
                    </div>
                </template>
                <!-- 不存在数据 -->
                <div v-else class="no-data">
                    <img :src="noneSrc" alt="none">
                    <span>此用户暂时没有发布视频</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.content {
    width: 98%;
    margin: 0 auto;
    padding: 10px;
    background-color: rgba(255, 255, 255, 0.3);
    border-radius: 20px;

    .top-bar {
        padding: 10px 20px;

        .label {
            padding-bottom: 10px;
            display: flex;
            align-items: center;

            .title,
            .capacity {
                max-width: 80%;
                font-size: 20px;
                font-weight: 500;
            }

            .capacity {
                margin-left: 10px;
            }

            .host-hint {
                margin-left: 20px;
                color: $color-text-secondary;

                cursor: pointer;
                border-radius: 15px;

                padding: 3px 10px;
                font-size: 14px;
                font-weight: 500;

                backdrop-filter: blur(18px) saturate(160%);
                -webkit-backdrop-filter: blur(18px) saturate(160%);
                border: 1px solid rgba(255, 255, 255, 0.35);
                box-shadow:
                    0 8px 30px rgba(0, 0, 0, 0.12),
                    inset 0 1px 0 rgba(255, 255, 255, 0.45);

                transition: background-color 0.2s ease, border-color 0.2s ease;

                &:hover {
                    background-color: $color-mask-10;
                    border-color: $color-mask-10;
                }

                &.confirm {
                    background-color: $color-bilibili-blue-80;
                    color: white;
                }
            }
        }


        .serie-description {
            border-top: 1px solid $color-mask-20;
            padding-top: 10px;
            font-size: 16px;
            color: $color-text-secondary;
        }
    }

    .main-content {
        padding: 10px 20px;

        .series-list {

            .series-items {
                width: 100%;
                display: flex;
                flex-wrap: wrap;
                justify-content: start;
                column-gap: 20px;
                row-gap: 10px;

                .serie-add-item,
                .serie-card,
                .serie-link,
                .serie-item {
                    width: 230px;
                    height: 190px;
                }

                .serie-card {
                    position: relative;
                }

                .serie-link {
                    display: block;
                    color: inherit;
                    text-decoration: none;
                }

                .serie-add-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    row-gap: 8px;

                    border: 2px dashed $color-border;
                    border-radius: 15px;
                    background-color: rgba(255, 255, 255, 0.35);
                    color: $color-text-secondary;
                    cursor: pointer;
                    transition:
                        border-color 0.2s ease,
                        color 0.2s ease,
                        background-color 0.2s ease;

                    .add-icon {
                        font-size: 44px;
                        line-height: 1;
                        font-weight: 300;
                    }

                    .add-text {
                        font-size: 15px;
                        font-weight: 500;
                    }

                    &:hover {
                        border-color: $color-bilibili-blue;
                        background-color: rgba(255, 255, 255, 0.55);
                        color: $color-bilibili-blue;
                    }
                }

                .serie-item {
                    background-color: rgba(255, 255, 255, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.35);
                    box-shadow:
                        0 8px 30px rgba(0, 0, 0, 0.12),
                        inset 0 1px 0 rgba(255, 255, 255, 0.45);

                    cursor: pointer;
                }

                .serie-item-chosen {
                    cursor: grabbing;
                }

                .serie-item-ghost {
                    opacity: 0.4;
                }

                .serie-item-dragging {
                    cursor: grabbing;
                }
            }
        }

        .videos-list {

            .serie-add-item {
                width: 265px;
                height: 200px;

                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                row-gap: 8px;

                border: 2px dashed $color-border;
                border-radius: 15px;
                background-color: rgba(255, 255, 255, 0.35);
                color: $color-text-secondary;
                cursor: pointer;
                transition:
                    border-color 0.2s ease,
                    color 0.2s ease,
                    background-color 0.2s ease;

                .modify-icon {
                    font-size: 44px;
                    line-height: 1;
                    font-weight: 300;
                }

                .modify-text {
                    font-size: 15px;
                    font-weight: 500;
                }

                &:hover {
                    border-color: $color-bilibili-blue;
                    background-color: rgba(255, 255, 255, 0.55);
                    color: $color-bilibili-blue;
                }
            }

            .video-items {
                display: flex;
                flex-wrap: wrap;
                justify-content: start;
                column-gap: 20px;
                row-gap: 20px;
                margin: 0 auto;

                .video-item {
                    width: 265px;
                    height: 200px;
                    position: relative;

                    .item {
                        background-color: rgba(255, 255, 255, 0.5);
                        border: 1px solid rgba(255, 255, 255, 0.35);
                        box-shadow:
                            0 8px 30px rgba(0, 0, 0, 0.12),
                            inset 0 1px 0 rgba(255, 255, 255, 0.45);
                    }
                }
            }

            .video-item-ghost {
                opacity: 0.4;
            }

            .video-item-chosen {
                cursor: grabbing;
            }

            .video-item-dragging {
                cursor: grabbing;
            }

        }

        .no-data {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
    }

    .delete-action {
        position: absolute;
        top: 0;
        left: 0;
        z-index: 5;
        width: 56px;
        height: 56px;
        padding: 0;
        background-color: $color-mask-20;
        border: none;
        clip-path: path('M 15 0 H 56 L 0 56 V 15 Q 0 0 20 0 Z');
        cursor: pointer;
        transition: background-color 0.2s ease;

        img {
            position: absolute;
            top: 8px;
            left: 8px;
            width: 16px;
            height: 16px;
            object-fit: contain;
            pointer-events: none;
        }

        &:hover {
            background-color: $color-mask-40;
        }
    }
}
</style>
