<script lang="ts" setup>
import VideoItem from '@/shared/entities/videoItem/ui/VideoItem.vue';
import { useUserHomeVideoList } from '../model/useUserHomeVideoList';
import noneSrc from "@/assets/icon/img/none.svg"
import { useRoute } from 'vue-router';

const { videoInfoList, hasVideo, count } = useUserHomeVideoList()

const route = useRoute()

</script>

<template>
    <div class="content">
        <div class="title">
            <div class="title-text">
                <span class="title-main-text">视频</span>
                <span class="title-counter-text">({{ count ?? 0 }})</span>
            </div>
            <RouterLink v-if="hasVideo" :to="`/user/${route.params.userId}/upload`" class="view-more">
                查看更多 >
            </RouterLink>
        </div>
        <div v-if="hasVideo" class="video-items">
            <div class="video-item" v-for="item in videoInfoList">
                <VideoItem class="item" :video-info="item" type="horizontal" />
            </div>
        </div>
        <div v-else class="no-data">
            <img :src="noneSrc" alt="none">
            <span>此用户暂时没有发布视频</span>
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

        .title-text {
            display: flex;
            align-items: baseline;
            column-gap: 5px;

            font-weight: 500;

            .title-main-text {
                font-size: 20px;
            }

            .title-counter-text {
                color: $color-text-secondary;
                font-size: 16px;
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

    .video-items {
        width: 100%;
        display: flex;
        flex-wrap: wrap;
        justify-content: start;
        column-gap: 10px;
        row-gap: 10px;

        .video-item {
            width: 225px;
            height: 185px;

            .item {
                background-color: rgba(255, 255, 255, 0.5);
                border: 1px solid rgba(255, 255, 255, 0.35);
                box-shadow:
                    0 8px 30px rgba(0, 0, 0, 0.12),
                    inset 0 1px 0 rgba(255, 255, 255, 0.45);
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