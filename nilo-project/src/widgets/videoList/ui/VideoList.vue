<script setup lang="ts">
import type { VideoList } from '@/shared/model/VideoList';
import VideoLayout from '@/entities/videoLayout/ui/VideoLayout.vue';
import VideoItem from '@/entities/videoItem/ui/VideoItem.vue';
import NoData from '@/entities/noData/ui/NoData.vue';
import { inject } from 'vue';

const videoList = inject<VideoList | undefined>('videoList')
</script>

<template>
    <div class="container">
        <VideoLayout>
            <template #default="{ videoInfo }">
                <VideoItem class="video-item" :video-info="videoInfo" type="horizontal"></VideoItem>
            </template>
        </VideoLayout>
        <NoData v-if="!videoList?.list || videoList.list.length === 0"></NoData>
    </div>
</template>

<style lang="scss" scoped>
$recommend-item-h: 204px;

.container {
    .video-item {
        height: $recommend-item-h;
    }
}
</style>