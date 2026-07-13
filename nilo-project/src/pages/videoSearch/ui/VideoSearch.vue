<script setup lang="ts">
import IndexHeader from '@/shared/widgets/indexHeader/ui/IndexHeader.vue';
import SearchBar from '@/shared/features/searchBar/ui/SearchBar.vue';
import VideoItem from '@/shared/entities/videoItem/ui/VideoItem.vue';
import { useVideoSearch } from '../composables/useVideoSearch';

const {
    orderTypeOptions,
    activeOrderType,
    videoList,
    pageNo,
    pageSize,
    totalCount,
    searchVideo,
    selectOrderType,
} = useVideoSearch();
</script>

<template>
    <div class="video-search-page">
        <IndexHeader theme="dark" :show-search="false" />
        <main class="video-search-main">
            <div class="search-section">
                <SearchBar :open-in-new-page="false" />
            </div>
            <div class="order-type-bar" role="radiogroup" aria-label="搜索排序">
                <button v-for="option in orderTypeOptions" :key="option.value" class="order-type-item"
                    :class="{ active: activeOrderType === option.value }" role="radio"
                    :aria-checked="activeOrderType === option.value" @click="selectOrderType(option.value)">
                    {{ option.label }}
                </button>
            </div>
            <section class="video-result-section">
                <div v-if="videoList.length > 0" class="video-result-grid">
                    <VideoItem v-for="(videoInfo, index) in videoList" :key="videoInfo.videoId ?? index"
                        class="video-result-item" :video-info="videoInfo" type="horizontal" :render-title-html="true" />
                </div>
                <div v-else class="empty-result">暂无搜索结果</div>
                <div v-if="totalCount > 0" class="pagination">
                    <el-pagination layout="prev, pager, next" :total="totalCount" :page-size="pageSize"
                        :current-page="pageNo" @current-change="(newPageNo: number) => searchVideo(newPageNo)" />
                </div>
            </section>
        </main>
    </div>
</template>

<style lang="scss" scoped>
.video-search-page {
    min-height: 100vh;
    background-color: white;
}

.video-search-main {
    width: min(1480px, calc(100% - 80px));
    margin: 0 auto;
    padding: 38px 0 56px;
}

.search-section {
    width: min(760px, 100%);
    margin: 0 auto;
}

.order-type-bar {
    display: flex;
    justify-content: center;
    align-items: center;
    column-gap: 12px;
    margin-top: 26px;
}

.order-type-item {
    min-width: 88px;
    height: 34px;
    padding: 0 16px;
    border: 1px solid transparent;
    border-radius: 8px;
    color: $color-text-secondary;
    font-size: 14px;
    line-height: 32px;
    background-color: transparent;
    cursor: pointer;
    transition: color 0.16s ease, background-color 0.16s ease, border-color 0.16s ease;

    &:hover {
        color: $color-bilibili-blue;
        background-color: $color-mask-5;
    }

    &.active {
        color: $color-bilibili-blue;
        border-color: rgba(0, 174, 236, 0.22);
        background-color: rgba(0, 174, 236, 0.08);
        font-weight: 500;
    }
}

.video-result-section {
    margin-top: 34px;
}

.video-result-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: $video-item-gap;
}

.video-result-item {
    height: $video-item-height;
}

.empty-result {
    min-height: 260px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $color-text-muted;
    font-size: 15px;
    border-radius: 8px;
    background-color: $color-surface;
}

.pagination {
    display: flex;
    justify-content: center;
    margin-top: 28px;
}
</style>
