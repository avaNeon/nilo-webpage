<script setup lang="ts">
import SectionTitle from '@/shared/ui/SectionTitle.vue'
import { HOT_VIDEO_TOP_COUNT, useHotVideoTop } from '../model/useHotVideoTop'
import HotVideoRow from './HotVideoRow.vue'

const { hotVideoList, hotVideoLoading } = useHotVideoTop()
</script>

<template>
    <div class="hot-video-panel">
        <div class="panel-head">
            <SectionTitle eyebrow="24 HOURS · TOP 5" title="24小时热门视频" size="md" />
            <RouterLink class="more-link" to="/popular" target="_blank">完整榜单 →</RouterLink>
        </div>

        <!-- 加载中：与真实行同尺寸的骨架 -->
        <div v-if="hotVideoLoading" class="skeleton-list" aria-busy="true" aria-label="加载中">
            <div v-for="n in HOT_VIDEO_TOP_COUNT" :key="n" class="skeleton-row">
                <span class="skeleton-block skeleton-rank"></span>
                <span class="skeleton-block skeleton-thumb"></span>
                <span class="skeleton-text">
                    <span class="skeleton-block skeleton-title"></span>
                    <span class="skeleton-block skeleton-sub"></span>
                </span>
            </div>
        </div>

        <div v-else-if="hotVideoList.length === 0" class="empty">
            <span class="empty-art" aria-hidden="true">00</span>
            <span class="empty-eyebrow">NO HOT VIDEOS · 24H</span>
            <p class="empty-text">过去 24 小时还没有热门视频</p>
            <RouterLink class="empty-link" to="/popular" target="_blank">去看看完整榜单 →</RouterLink>
        </div>

        <div v-else class="rank-list">
            <HotVideoRow v-for="(videoInfo, index) in hotVideoList" :key="videoInfo.videoId ?? index"
                :video-info="videoInfo" :rank="index + 1" />
        </div>
    </div>
</template>

<style lang="scss" scoped>
.hot-video-panel {
    display: flex;
    flex-direction: column;
    min-width: 0;
    padding: 28px 28px 12px;
    border-radius: 24px;
    background: $warm-card;
    box-shadow: $warm-shadow-card;
}

.panel-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 12px;
}

.more-link {
    flex-shrink: 0;
    font-size: 13px;
    color: $warm-ink-3;
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
        color: $warm-accent-hover;
    }
}

.rank-list {
    display: flex;
    flex-direction: column;
}

/*——————骨架—————— */

.skeleton-list {
    display: flex;
    flex-direction: column;
}

.skeleton-row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 0;
    border-top: 1px solid $warm-line-soft;
}

.skeleton-block {
    display: block;
    border-radius: 6px;
    background: $warm-sunken;
}

.skeleton-rank {
    width: 22px;
    height: 16px;
    margin-right: 4px;
}

.skeleton-thumb {
    width: 88px;
    height: 50px;
    border-radius: 8px;
    flex-shrink: 0;
}

.skeleton-text {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    min-width: 0;
}

.skeleton-title {
    width: 78%;
    height: 13px;
}

.skeleton-sub {
    width: 42%;
    height: 10px;
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
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 280px;
    padding: 24px 0 16px;
    border-top: 1px solid $warm-line-soft;
    text-align: center;
}

.empty-art {
    font-size: 56px;
    font-weight: 700;
    font-style: italic;
    line-height: 1;
    letter-spacing: -0.02em;
    color: transparent;
    -webkit-text-stroke: 1.2px $warm-ink-5;
    margin-bottom: 6px;
}

.empty-eyebrow {
    font-family: $warm-font-mono;
    font-size: 11px;
    letter-spacing: 0.14em;
    color: $warm-ink-5;
}

.empty-text {
    margin: 0;
    font-size: 14px;
    color: $warm-ink-4;
}

.empty-link {
    font-size: 13px;
    color: $warm-ink-3;
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
        color: $warm-accent-hover;
    }
}
</style>
