<script setup lang="ts">
import type { VideoInfo } from '@/shared/model/VideoInfo';
import SectionTitle from '@/shared/ui/SectionTitle.vue';
import VideoCard from '@/shared/entities/videoCard/ui/VideoCard.vue';
import VideoCardSkeleton from '@/pages/index/entities/videoCardSkeleton/ui/VideoCardSkeleton.vue';
import { computed } from 'vue';

/** 加载中占位卡片数（两行） */
const SKELETON_COUNT = 8
/** 每行卡片数 */
const COLUMN_COUNT = 4
/** 大卡片占两行两列 */
const FEATURED_CELL_COUNT = 4

const props = withDefaults(defineProps<{
    /** 轮播之外的推荐视频，第一个显示成两行两列的大卡片 */
    videos: VideoInfo[],
    /** 推荐接口加载中，显示占位卡片 */
    loading?: boolean,
}>(), {
    loading: false,
})

/**
 * 大卡片只在能排满整行时出现：大卡片占 4 格，剩下的普通卡片要把最后一行补齐，
 * 多出来的几个不显示，免得最后一行只剩一两张；视频太少时全部用普通卡片
 */
const hasFeatured = computed(() => props.videos.length >= FEATURED_CELL_COUNT + 1)
const displayVideos = computed(() =>
{
    if (!hasFeatured.value)
    {
        return props.videos
    }
    const cellCount = FEATURED_CELL_COUNT + props.videos.length - 1
    const fullCellCount = cellCount - cellCount % COLUMN_COUNT
    return props.videos.slice(0, fullCellCount - FEATURED_CELL_COUNT + 1)
})
</script>

<template>
    <!-- 加载完成后没有推荐视频时整块隐藏 -->
    <section v-if="loading || videos.length" class="for-you" :aria-busy="loading">
        <div class="section-head">
            <SectionTitle title="为你推荐" size="lg" />
        </div>
        <div class="video-grid">
            <template v-if="loading">
                <VideoCardSkeleton v-for="index in SKELETON_COUNT" :key="index" />
            </template>
            <template v-else>
                <VideoCard v-for="(videoInfo, index) in displayVideos" :key="videoInfo.videoId ?? index"
                    :video-info="videoInfo" :layout="index === 0 && hasFeatured ? 'featured' : 'grid'" />
            </template>
        </div>
    </section>
</template>

<style lang="scss" scoped>
.for-you {
    display: flex;
    flex-direction: column;
    gap: 32px;
    margin-top: 88px;

    .section-head {
        padding-bottom: 22px;
        border-bottom: 1px solid $warm-line;
    }

    .video-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 40px 24px;
    }
}
</style>
