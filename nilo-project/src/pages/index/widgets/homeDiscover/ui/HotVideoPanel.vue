<script setup lang="ts">
import SectionTitle from '@/shared/ui/SectionTitle.vue'
import { HOT_VIDEO_TOP_COUNT, useHotVideoTop } from '../model/useHotVideoTop'
import HotVideoRow from './HotVideoRow.vue'

const { hotVideoList, hotVideoLoading } = useHotVideoTop()
</script>

<template>
    <!-- 24 小时热门视频前 5 名，一行排开 -->
    <section class="hot-video-section" aria-label="热门视频">
        <div class="section-head">
            <SectionTitle title="热门视频" size="lg">最近 24 小时热门视频</SectionTitle>
            <RouterLink class="more-link" to="/popular" target="_blank">完整榜单 →</RouterLink>
        </div>

        <!-- 加载中：与真实卡片同尺寸的骨架 -->
        <div v-if="hotVideoLoading" class="rank-grid" aria-busy="true" aria-label="加载中">
            <div v-for="n in HOT_VIDEO_TOP_COUNT" :key="n" class="skeleton-card">
                <span class="skeleton-block skeleton-rank"></span>
                <span class="skeleton-block skeleton-thumb"></span>
                <span class="skeleton-block skeleton-title"></span>
                <span class="skeleton-block skeleton-sub"></span>
            </div>
        </div>

        <div v-else-if="hotVideoList.length === 0" class="empty">
            <span class="empty-art" aria-hidden="true">00</span>
            <p class="empty-text">过去 24 小时还没有热门视频</p>
            <RouterLink class="empty-link" to="/popular" target="_blank">去看看完整榜单 →</RouterLink>
        </div>

        <div v-else class="rank-grid">
            <HotVideoRow v-for="(videoInfo, index) in hotVideoList" :key="videoInfo.videoId ?? index"
                :video-info="videoInfo" :rank="index + 1" />
        </div>
    </section>
</template>

<style lang="scss" scoped>
.hot-video-section {
    display: flex;
    flex-direction: column;
    gap: 32px;
    margin-top: 96px;
}

.section-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
    padding-bottom: 22px;
    border-bottom: 1px solid $warm-line;
}

.more-link {
    flex-shrink: 0;
    font-size: 13px;
    font-weight: 500;
    color: $warm-accent;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
        text-underline-offset: 3px;
    }
}

.rank-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 24px;
}

/*——————骨架—————— */

.skeleton-card {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.skeleton-block {
    display: block;
    border-radius: 6px;
    background: $warm-sunken;
}

.skeleton-rank {
    width: 34px;
    height: 44px;
    border-radius: 8px;
}

.skeleton-thumb {
    aspect-ratio: 16 / 9;
    border-radius: 14px;
}

.skeleton-title {
    width: 86%;
    height: 14px;
}

.skeleton-sub {
    width: 42%;
    height: 11px;
    margin-top: -6px;
}

@media (prefers-reduced-motion: no-preference) {
    .skeleton-block {
        animation: skeleton-pulse 1.4s ease-in-out infinite;
    }
}

@keyframes skeleton-pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.55;
    }
}

/*——————空状态—————— */

.empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    height: 220px;
    border-radius: 22px;
    background: $warm-sunken;
    text-align: center;
}

.empty-art {
    font-size: 56px;
    font-weight: 200;
    line-height: 1;
    letter-spacing: -0.05em;
    color: $warm-accent;
}

.empty-text {
    margin: 0;
    font-size: 14px;
    color: $warm-ink-4;
}

.empty-link {
    font-size: 13px;
    font-weight: 500;
    color: $warm-accent;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
        text-underline-offset: 3px;
    }
}
</style>
