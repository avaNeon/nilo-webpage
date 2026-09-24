<script lang="ts" setup>
import { computed, inject } from 'vue'
import SiteHeader from '@/shared/widgets/siteHeader/ui/SiteHeader.vue'
import HomeFooter from '@/pages/index/widgets/homeFooter/ui/HomeFooter.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import HistoryCard from './HistoryCard.vue'
import { useVideoHistory } from '../composables/useVideoHistory'

// 获取内容部分最大最小宽度
const mainContentMaxWidth: number = inject('mainContentMaxWidth', 0)
const mainContentMinWidth: number = inject('mainContentMinWidth', 0)

/** 首屏骨架屏卡片数，正好一行 */
const SKELETON_COUNT = 5

const {
    historyItemMap,
    historyCount,
    loading,
    finished,
    loadedOnce,
    deleting,
    clearPending,
    clearCountdown,
    deleteHistoryItem,
    deleteAllHistory,
    undoClear,
    getTimelineDayLabel,
    formatWatchTime,
} = useVideoHistory()

// 分页加载，全部加载完才知道总数
const countLabel = computed(() => finished.value && historyCount.value > 0 ? `共 ${historyCount.value} 个视频` : '')
</script>

<template>
    <div class="history-page warm-theme">
        <SiteHeader />
        <main class="history-main" :style="{
            'max-width': mainContentMaxWidth + 'px',
            'min-width': mainContentMinWidth + 'px',
        }">
            <div class="page-head">
                <div class="head-title">
                    <h1>历史记录</h1>
                    <span v-if="countLabel" class="head-sub">{{ countLabel }}</span>
                </div>
                <button v-if="historyCount > 0" type="button" class="clear-button" :disabled="deleting"
                    @click="deleteAllHistory">
                    清空全部
                </button>
            </div>

            <div v-if="!loadedOnce" class="timeline" aria-busy="true">
                <section class="day-group latest last">
                    <span class="rail" aria-hidden="true"><span class="rail-dot"></span></span>
                    <div class="group-body">
                        <span class="skeleton-block skeleton-label"></span>
                        <div class="card-grid">
                            <div v-for="n in SKELETON_COUNT" :key="n" class="skeleton-card">
                                <span class="skeleton-block skeleton-cover"></span>
                                <span class="skeleton-block skeleton-title"></span>
                                <span class="skeleton-block skeleton-sub"></span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <EmptyState v-else-if="historyItemMap.size === 0" title="还没有观看记录" description="看过的视频会按日期出现在这里">
                <RouterLink to="/" class="empty-primary">去首页看看</RouterLink>
                <button v-if="clearPending" type="button" class="empty-secondary" @click="undoClear">
                    撤销清空（{{ clearCountdown }}s）
                </button>
            </EmptyState>

            <div v-else class="timeline">
                <!-- 按天分组，左侧时间轴：最近一天蓝点，其余灰点 -->
                <section v-for="([date, items], groupIndex) in historyItemMap" :key="date"
                    :class="['day-group', { latest: groupIndex === 0, last: groupIndex === historyItemMap.size - 1 }]">
                    <span class="rail" aria-hidden="true">
                        <span class="rail-dot"></span>
                        <span class="rail-line"></span>
                    </span>
                    <div class="group-body">
                        <div class="group-head">
                            <span class="group-label">{{ getTimelineDayLabel(date) }}</span>
                            <span v-if="date !== 'unknown'" class="group-date">{{ date }}</span>
                            <span class="group-count">{{ items.length }} 个</span>
                        </div>
                        <div class="card-grid">
                            <HistoryCard v-for="item in items"
                                :key="`${item.history.videoId}-${item.history.fileIndex}-${item.history.lastUpdateTime}`"
                                :item="item" :watched-text="formatWatchTime(item.history.lastUpdateTime)"
                                :deleting="deleting" @delete="deleteHistoryItem(item.history)" />
                        </div>
                    </div>
                </section>
                <span class="list-end">{{ loading ? '加载中…' : finished ? '没有更多了' : '继续向下滚动加载更多' }}</span>
            </div>
        </main>
        <HomeFooter divider />
    </div>
</template>

<style lang="scss" scoped>
.history-page {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 100vh;
}

.history-main {
    flex: 1 0 auto;
    display: flex;
    flex-direction: column;
    gap: 40px;
    width: 100%;
    margin: 0 auto;
    padding: 40px 48px 104px;
}

.page-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
    padding-bottom: 22px;
    border-bottom: 1px solid $warm-line;

    .head-title {
        display: flex;
        align-items: baseline;
        gap: 16px;
    }

    h1 {
        margin: 0;
        font-size: 34px;
        font-weight: 800;
        letter-spacing: -0.015em;
    }

    .head-sub {
        font-size: 13px;
        color: $warm-ink-4;
    }
}

// 浅灰胶囊，悬停变墨色
.clear-button {
    display: flex;
    align-items: center;
    height: 38px;
    padding: 0 18px;
    border: none;
    border-radius: 999px;
    background: $warm-sunken;
    color: $warm-ink;
    font: inherit;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;

    &:hover:not(:disabled) {
        background: $warm-ink;
        color: #FFFFFF;
    }

    &:focus-visible {
        outline: 2px solid $warm-accent;
        outline-offset: 2px;
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.6;
    }
}

.timeline {
    display: flex;
    flex-direction: column;
    gap: 56px;
}

.day-group {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr);
}

// 时间轴：圆点对齐分组标题，竖线接到下一组的圆点
.rail {
    position: relative;
    display: block;

    .rail-dot {
        position: absolute;
        left: 5px;
        top: 8px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: $warm-dot;
        box-shadow: 0 0 0 4px #FFFFFF;
    }

    .rail-line {
        position: absolute;
        left: 10.5px;
        top: 28px;
        bottom: -48px;
        width: 1px;
        background: rgba(11, 12, 18, 0.1);
    }

    .latest & .rail-dot {
        background: $warm-accent;
    }

    .last & .rail-line {
        display: none;
    }
}

.group-body {
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-width: 0;
}

.group-head {
    display: flex;
    align-items: baseline;
    gap: 12px;

    .group-label {
        font-size: 20px;
        font-weight: 800;
        letter-spacing: -0.01em;
        color: $warm-ink-3;

        .latest & {
            color: $warm-ink;
        }
    }

    .group-date {
        font-family: $warm-font-mono;
        font-size: 12px;
        color: $warm-ink-4;
    }

    .group-count {
        font-size: 12px;
        color: $warm-ink-5;
    }
}

.card-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 36px 20px;
}

.list-end {
    align-self: center;
    font-size: 12px;
    color: $warm-ink-5;
}

/*——————骨架屏—————— */

.skeleton-block {
    display: block;
    border-radius: 6px;
    background: $warm-sunken;
}

.skeleton-label {
    width: 120px;
    height: 24px;
    margin-top: 2px;
}

.skeleton-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.skeleton-cover {
    aspect-ratio: 16 / 9;
    border-radius: 16px;
}

.skeleton-title {
    width: 88%;
    height: 15px;
}

.skeleton-sub {
    width: 56%;
    height: 12px;
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
