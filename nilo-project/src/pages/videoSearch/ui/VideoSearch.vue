<script setup lang="ts">
import { inject } from 'vue';
import SiteHeader from '@/shared/widgets/siteHeader/ui/SiteHeader.vue';
import SiteSearchBar from '@/shared/widgets/siteHeader/ui/SiteSearchBar.vue';
import HomeFooter from '@/pages/index/widgets/homeFooter/ui/HomeFooter.vue';
import EmptyState from '@/shared/ui/EmptyState.vue';
import SearchResultCard from './SearchResultCard.vue';
import { useVideoSearch } from '../composables/useVideoSearch';

const mainContentMaxWidth: number = inject('mainContentMaxWidth', 0)
const mainContentMinWidth: number = inject('mainContentMinWidth', 0)

/** 首次搜索时的骨架屏数量，正好两行 */
const SKELETON_COUNT = 10

const {
    keyword,
    loading,
    orderTypeOptions,
    activeOrderType,
    videoList,
    pageNo,
    pageSize,
    totalCount,
    searchVideo,
    selectOrderType,
} = useVideoSearch();

/** 翻页后回到顶部，从第一排开始看 */
async function changePage(nextPageNo: number)
{
    window.scrollTo({ top: 0, behavior: 'smooth' });
    await searchVideo(nextPageNo);
}
</script>

<template>
    <div class="search-page warm-theme">
        <!-- 页面自带大搜索框，顶栏就不放了 -->
        <SiteHeader hide-search />
        <main class="search-main" :style="{
            'max-width': mainContentMaxWidth + 'px',
            'min-width': mainContentMinWidth + 'px',
        }">
            <div class="search-top">
                <SiteSearchBar large :open-in-new-page="false" />
                <div class="sort-bar" role="radiogroup" aria-label="搜索排序">
                    <button v-for="option in orderTypeOptions" :key="option.value" type="button"
                        :class="['sort-item', { active: activeOrderType === option.value }]" role="radio"
                        :aria-checked="activeOrderType === option.value" @click="selectOrderType(option.value)">
                        {{ option.label }}
                    </button>
                </div>
            </div>

            <section v-if="keyword" class="results">
                <div class="results-head">
                    <span class="query">“{{ keyword }}”</span>
                    <span v-if="!(loading && videoList.length === 0)" class="count">
                        找到 {{ totalCount }} 个相关视频
                    </span>
                </div>

                <div v-if="loading && videoList.length === 0" class="result-grid" aria-busy="true">
                    <div v-for="n in SKELETON_COUNT" :key="n" class="skeleton-card">
                        <span class="skeleton-block skeleton-cover"></span>
                        <span class="skeleton-block skeleton-title"></span>
                        <span class="skeleton-block skeleton-sub"></span>
                    </div>
                </div>

                <EmptyState v-else-if="videoList.length === 0" title="没有找到相关视频"
                    description="换个关键词，或者换一种排序试试" />

                <div v-else :class="['result-grid', { refreshing: loading }]" :aria-busy="loading">
                    <SearchResultCard v-for="(videoInfo, index) in videoList" :key="videoInfo.videoId ?? index"
                        :video-info="videoInfo" />
                </div>
            </section>

            <EmptyState v-else title="想看点什么？" description="输入关键词，搜索视频、创作者和话题" />

            <el-pagination v-if="keyword && totalCount > pageSize" class="search-pagination" layout="prev, pager, next"
                prev-text="←" next-text="→" :total="totalCount" :page-size="pageSize" :current-page="pageNo"
                @current-change="changePage" />
        </main>
        <HomeFooter divider />
    </div>
</template>

<style lang="scss" scoped>
.search-page {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 100vh;
}

.search-main {
    flex: 1 0 auto;
    display: flex;
    flex-direction: column;
    gap: 40px;
    width: 100%;
    margin: 0 auto;
    padding: 40px 48px 104px;
}

.search-top {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 22px;
    // 搜索面板要盖在结果上面
    position: relative;
    z-index: 2;
}

// 排序：选中蓝底白字，其余只有文字
.sort-bar {
    display: flex;
    gap: 8px;
}

.sort-item {
    display: flex;
    align-items: center;
    height: 36px;
    padding: 0 16px;
    border: none;
    border-radius: 999px;
    background: transparent;
    color: $warm-ink-3;
    font: inherit;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: color 0.2s, background-color 0.2s;

    &:hover {
        color: $warm-accent;
    }

    &:focus-visible {
        outline: 2px solid $warm-accent;
        outline-offset: 2px;
    }

    &.active {
        background: $warm-accent;
        color: #FFFFFF;
        font-weight: 600;
    }
}

.results {
    display: flex;
    flex-direction: column;
    gap: 28px;
}

.results-head {
    display: flex;
    align-items: baseline;
    gap: 12px;
    padding-bottom: 18px;
    border-bottom: 1px solid $warm-line;

    .query {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 20px;
        font-weight: 800;
        letter-spacing: -0.01em;
    }

    .count {
        flex-shrink: 0;
        font-size: 13px;
        color: $warm-ink-4;
    }
}

.result-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 40px 24px;
    transition: opacity 0.2s;

    // 换排序/翻页时旧结果先变淡
    &.refreshing {
        opacity: 0.5;
        pointer-events: none;
    }
}

/*——————分页：圆形按钮，当前页墨色—————— */

.search-pagination {
    align-self: center;
    gap: 6px;
    margin-top: 16px;
    --el-pagination-font-size: 13px;
    --el-pagination-button-width: 40px;
    --el-pagination-button-height: 40px;
    --el-pagination-bg-color: transparent;
    --el-pagination-button-bg-color: transparent;

    :deep(.el-pager) {
        gap: 6px;
    }

    :deep(.el-pager li) {
        min-width: 40px;
        height: 40px;
        margin: 0;
        border-radius: 50%;
        background: transparent;
        color: $warm-ink-3;
        font-weight: 600;
        transition: color 0.2s, background-color 0.2s;

        &:hover {
            color: $warm-accent;
        }

        &.is-active {
            background: $warm-ink;
            color: #FFFFFF;
        }
    }

    :deep(.btn-prev),
    :deep(.btn-next) {
        width: 40px;
        min-width: 40px;
        height: 40px;
        margin: 0;
        padding: 0;
        border-radius: 50%;
        background: $warm-sunken;
        color: $warm-ink;
        font-size: 15px;
        transition: color 0.2s, background-color 0.2s;

        &:hover:not(:disabled) {
            background: $warm-accent;
            color: #FFFFFF;
        }

        &:disabled {
            background: $warm-sunken;
            color: $warm-dot;
        }

        span {
            min-width: 0;
            margin: 0;
            font-size: 15px;
            line-height: 1;
        }
    }
}

/*——————骨架屏—————— */

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

.skeleton-cover {
    aspect-ratio: 16 / 9;
    border-radius: 16px;
}

.skeleton-title {
    width: 90%;
    height: 15px;
}

.skeleton-sub {
    width: 52%;
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
