<script lang="ts" setup>
import { inject } from 'vue'
import SiteHeader from '@/shared/widgets/siteHeader/ui/SiteHeader.vue'
import HomeFooter from '@/pages/index/widgets/homeFooter/ui/HomeFooter.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import HotRankItem from './HotRankItem.vue'
import { useHotRanking } from '../composables/useHotRanking'

// 获取内容部分最大最小宽度
const mainContentMaxWidth: number = inject('mainContentMaxWidth', 0)
const mainContentMinWidth: number = inject('mainContentMinWidth', 0)

/** 首屏骨架屏行数，正好两列各五行 */
const SKELETON_COUNT = 10

const { hotRankingState } = useHotRanking()
</script>

<template>
    <div class="hot-page warm-theme">
        <SiteHeader />
        <main class="hot-main" :style="{
            'max-width': mainContentMaxWidth + 'px',
            'min-width': mainContentMinWidth + 'px',
        }">
            <div class="page-head">
                <span class="head-mark" aria-hidden="true"></span>
                <h1>24小时热榜</h1>
                <span class="head-sub">最近 24 小时热门视频</span>
            </div>

            <div v-if="!hotRankingState.loadedOnce" class="rank-grid" aria-busy="true">
                <div v-for="n in SKELETON_COUNT" :key="n" class="skeleton-row">
                    <span class="skeleton-block skeleton-rank"></span>
                    <span class="skeleton-block skeleton-cover"></span>
                    <span class="skeleton-text">
                        <span class="skeleton-block skeleton-title"></span>
                        <span class="skeleton-block skeleton-title short"></span>
                        <span class="skeleton-block skeleton-sub"></span>
                    </span>
                </div>
            </div>

            <EmptyState v-else-if="hotRankingState.videoList.length === 0" title="过去 24 小时还没有热门视频"
                description="过一会儿再来看看吧">
                <RouterLink to="/" class="empty-primary">去首页看看</RouterLink>
            </EmptyState>

            <template v-else>
                <div class="rank-grid">
                    <HotRankItem v-for="(videoInfo, index) in hotRankingState.videoList"
                        :key="videoInfo.videoId ?? index" :video-info="videoInfo" :rank="index + 1" />
                </div>
                <span class="list-end">
                    {{ hotRankingState.loading ? '加载中…' : hotRankingState.finished ? '没有更多了' : '继续向下滚动加载更多' }}
                </span>
            </template>
        </main>
        <HomeFooter divider />
    </div>
</template>

<style lang="scss" scoped>
.hot-page {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 100vh;
}

.hot-main {
    flex: 1 0 auto;
    display: flex;
    flex-direction: column;
    gap: 36px;
    width: 100%;
    margin: 0 auto;
    padding: 40px 48px 104px;
}

.page-head {
    display: flex;
    align-items: center;
    gap: 14px;
    padding-bottom: 22px;
    border-bottom: 1px solid $warm-line;

    // 蓝色圆 + 偏右上的白点
    .head-mark {
        position: relative;
        flex-shrink: 0;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: $warm-accent;

        &::after {
            content: '';
            position: absolute;
            left: 18px;
            top: 7px;
            width: 9px;
            height: 9px;
            border-radius: 50%;
            background: #FFFFFF;
        }
    }

    h1 {
        margin: 0;
        font-size: 34px;
        font-weight: 800;
        letter-spacing: -0.015em;
    }

    .head-sub {
        padding-top: 8px;
        font-size: 13px;
        color: $warm-ink-4;
    }
}

// 双列榜单
.rank-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px 48px;
}

.list-end {
    align-self: center;
    margin-top: 12px;
    font-size: 12px;
    color: $warm-ink-5;
}

/*——————骨架屏：和榜单行同样的三列—————— */

.skeleton-row {
    display: grid;
    grid-template-columns: 64px 272px minmax(0, 1fr);
    gap: 20px;
    align-items: start;
    padding: 12px 0;
}

.skeleton-block {
    display: block;
    border-radius: 6px;
    background: $warm-sunken;
}

.skeleton-rank {
    width: 34px;
    height: 50px;
    margin-top: 4px;
    border-radius: 8px;
}

.skeleton-cover {
    aspect-ratio: 16 / 9;
    border-radius: 16px;
}

.skeleton-text {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-top: 6px;
}

.skeleton-title {
    width: 92%;
    height: 15px;

    &.short {
        width: 58%;
    }
}

.skeleton-sub {
    width: 36%;
    height: 12px;
    margin-top: 6px;
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
</style>
