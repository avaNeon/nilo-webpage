<script lang="ts" setup>
import { useRoute } from 'vue-router';
import { useUserHomeSeries } from '../model/useUserHomeSeries';
import VideoItem from '@/shared/entities/videoItem/ui/VideoItem.vue';
import noneSrc from "@/assets/icon/img/none.svg"

const { videoSeriesWithVideos, hasSeries } = useUserHomeSeries()

const route = useRoute()


</script>

<template>
    <div class="content">
        <div class="title">
            <div class="left">
                <span class="title-text">
                    系列
                </span>
            </div>
            <RouterLink v-if="hasSeries" :to="`/user/${route.params.userId}/series`" class="view-more">
                查看更多 >
            </RouterLink>
        </div>
        <div v-if="hasSeries" class="series-items">
            <div class="series-item" v-for="serieItem in videoSeriesWithVideos">
                <div class="serie-title-content">
                    <RouterLink class="serie-title" :to="`/user/${route.params.userId}/series/${serieItem.seriesId}`">
                        系列 · {{ serieItem.seriesName }}
                    </RouterLink>
                    <div class="serie-video-count">共{{ serieItem.videoCount }}条视频</div>
                </div>
                <div class="video-items">
                    <div class="video-item" v-for="videoItem in serieItem.videoInfoList">
                        <VideoItem class="item" :video-info="videoItem" type="horizontal" />
                    </div>
                </div>
            </div>
        </div>
        <div v-else class="no-data">
            <img :src="noneSrc" alt="none">
            <span>此用户暂时没有发布包含视频的系列</span>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.content {
    width: 100%;

    display: flex;
    flex-direction: column;

    .title {
        padding: 10px 5px;
        display: flex;
        justify-content: space-between;
        align-items: baseline;

        .left {
            display: flex;
            column-gap: 10px;
            align-items: center;

            .title-text {
                font-size: 20px;
                font-weight: 500;

            }
        }


        .view-more {
            color: $color-text-secondary;
            font-size: 16px;
            font-weight: 500;
            text-decoration: none;
            transition: color 0.3s ease;

            &:hover {
                color: $color-bilibili-blue;
            }
        }
    }

    .series-items {
        width: 100%;
        display: flex;
        flex-direction: column;
        row-gap: 20px;

        .series-item {
            background-color: rgba(255, 255, 255, 0.3);
            border-radius: 15px;
            border: 1px solid rgba(255, 255, 255, 0.35);
            box-shadow:
                0 8px 30px rgba(0, 0, 0, 0.12),
                inset 0 1px 0 rgba(255, 255, 255, 0.45);

            padding: 15px;

            .serie-title-content {
                display: flex;
                justify-content: start;
                align-items: center;
                column-gap: 10px;

                .serie-title {
                    max-width: 80%;

                    padding: 0 5px;
    
                    font-size: 20px;
                    font-weight: 500;
                    color: $color-text-primary;
                    text-decoration: none;
    
                    transition: color 0.3s ease;
    
                    &:hover {
                        color: $color-bilibili-blue;
                    }
                }

                .serie-video-count {
                    color: $color-text-secondary;
                    font-size: 16px;
                }
            }

            .video-items {
                margin-top: 10px;
                width: 100%;
                display: flex;
                flex-wrap: wrap;
                justify-content: start;
                column-gap: 10px;
                row-gap: 5px;

                .video-item {
                    width: 215px;
                    height: 180px;

                    .item {
                        background-color: rgba(255, 255, 255, 0.5);
                        border: 1px solid rgba(255, 255, 255, 0.35);
                        box-shadow:
                            0 8px 30px rgba(0, 0, 0, 0.12),
                            inset 0 1px 0 rgba(255, 255, 255, 0.45);
                    }
                }
            }
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
</style>