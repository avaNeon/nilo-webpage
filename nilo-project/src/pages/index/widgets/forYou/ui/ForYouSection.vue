<script setup lang="ts">
import type { VideoInfo } from '@/shared/model/VideoInfo';
import SectionTitle from '@/shared/ui/SectionTitle.vue';
import VideoCard from '@/shared/entities/videoCard/ui/VideoCard.vue';
import VideoCardSkeleton from '@/pages/index/entities/videoCardSkeleton/ui/VideoCardSkeleton.vue';

/** 加载中占位卡片数（两行） */
const SKELETON_COUNT = 8

withDefaults(defineProps<{
    /** 轮播之外的推荐视频 */
    videos: VideoInfo[],
    /** 推荐接口加载中，显示占位卡片 */
    loading?: boolean,
}>(), {
    loading: false,
})
</script>

<template>
    <!-- 加载完成后没有推荐视频时整块隐藏 -->
    <section v-if="loading || videos.length" class="for-you" :aria-busy="loading">
        <SectionTitle eyebrow="FOR YOU" title="为你推荐" size="lg" />
        <div class="video-grid">
            <template v-if="loading">
                <VideoCardSkeleton v-for="index in SKELETON_COUNT" :key="index" />
            </template>
            <template v-else>
                <VideoCard v-for="(videoInfo, index) in videos" :key="videoInfo.videoId ?? index"
                    :video-info="videoInfo" layout="grid" />
            </template>
        </div>
    </section>
</template>

<style lang="scss" scoped>
.for-you {
    display: flex;
    flex-direction: column;
    gap: 28px;
    margin-top: 72px;

    .video-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 40px 24px;
    }
}
</style>
