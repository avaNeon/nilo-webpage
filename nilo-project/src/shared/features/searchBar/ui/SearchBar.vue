<script setup lang="ts">
import { useSearchBar } from '../model/useSearchBar';

const props = withDefaults(defineProps<{
    openInNewPage?: boolean,
}>(), {
    openInNewPage: true,
})

const {
    searchPanelVisible,
    searchKeyword,
    searchHistoryList,
    searchHistoryExpanded,
    searchHistoryExpandable,
    hotKeywordList,
    searchVideo,
    showSearchPanel,
    toggleSearchHistoryExpanded,
} = useSearchBar({
    openInNewPage: props.openInNewPage,
});
</script>

<template>
    <div class="search-bar" ref="searchBarRef" :class="{ active: searchPanelVisible }">
        <div class="search-bar-content" @click="showSearchPanel">
            <input v-model="searchKeyword" @keyup.enter="searchVideo()" />
            <div class="iconfont icon-search" @click="searchVideo()"></div>
        </div>
        <Transition name="search-panel-fade">
            <div v-if="searchPanelVisible" class="search-bar-panel">
                <div class="history">
                    <div class="panel-title">搜索历史</div>
                    <div ref="historyListRef" class="history-list" :class="{ collapsed: !searchHistoryExpanded }">
                        <button v-for="item in searchHistoryList" :key="item" class="history-item"
                            @click="searchVideo(item)">
                            {{ item }}
                        </button>
                    </div>
                    <button v-if="searchHistoryExpandable" class="history-expand-button"
                        @click="toggleSearchHistoryExpanded">
                        {{ searchHistoryExpanded ? '收起历史' : '展开更多历史' }}
                    </button>
                </div>
                <div class="trending">
                    <div class="panel-title">热搜</div>
                    <div v-if="hotKeywordList.length > 0" class="trending-list">
                        <button v-for="(item, index) in hotKeywordList" :key="item" class="trending-item"
                            @click="searchVideo(item)">
                            <span class="trending-rank">{{ index + 1 }}</span>
                            <span class="trending-title">{{ item }}</span>
                        </button>
                    </div>
                    <div v-else class="trending-empty">暂无热搜榜单</div>
                </div>
            </div>
        </Transition>
    </div>
</template>

<style lang="scss" scoped>
.search-bar {
    width: 100%;
    position: relative;

    &.active {
        .search-bar-content {
            opacity: 1;
            border-radius: 8px 8px 0 0;
        }
    }
}

.search-bar-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: $color-neutral-1;
    opacity: 0.8;
    border-radius: 8px;
    padding: 0 8px;
    height: 36px;
    position: relative;
    z-index: 500;

    &:hover {
        opacity: 1;
    }

    input {
        padding: 0 10px;
        width: 100%;
        border: none;
        background: none;
        outline: none;
        border-radius: 10px;
        height: 30px;
        background-color: $color-neutral-1;
        opacity: inherit;

        &:focus {
            background-color: $color-mask-10;
            z-index: 400;
        }
    }

    .icon-search {
        color: #18191c;
        font-size: 18px;
        line-height: 18px;
        cursor: pointer;
        padding-left: 15px;
    }
}

.search-bar-panel {
    position: absolute;
    top: 36px;
    left: 0;
    z-index: 400;
    width: 100%;
    box-sizing: border-box;
    padding: 16px;
    background-color: $color-neutral-1;
    border-radius: 0 0 8px 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

    .panel-title {
        margin-bottom: 10px;
        color: #18191c;
        font-size: 15px;
        font-weight: 600;
        line-height: 20px;
    }

    .history {
        margin-bottom: 18px;
    }

    .history-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        &.collapsed {
            max-height: 68px;
            overflow: hidden;
        }
    }

    .history-expand-button {
        display: block;
        margin: 10px auto 0;
        padding: 0;
        border: none;
        color: $color-bilibili-blue;
        font-size: 13px;
        line-height: 18px;
        background: transparent;
        cursor: pointer;

        &:hover {
            font-weight: 500;
        }
    }

    .history-item,
    .trending-item {
        border: none;
        cursor: pointer;
        font-family: inherit;
    }

    .history-item {
        max-width: 100%;
        padding: 6px 12px;
        color: #61666d;
        font-size: 13px;
        line-height: 18px;
        background-color: $color-mask-5;
        border-radius: 6px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        &:hover {
            color: $color-bilibili-blue;
            background-color: white;
        }
    }

    .trending-list {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        column-gap: 8px;
        row-gap: 4px;
    }

    .trending-empty {
        padding: 8px 6px;
        color: #9499a0;
        font-size: 14px;
        line-height: 20px;
    }

    .trending-item {
        display: flex;
        align-items: center;
        column-gap: 10px;
        width: 100%;
        min-width: 0;
        padding: 8px 6px;
        color: #18191c;
        text-align: left;
        background: transparent;
        border-radius: 6px;

        &:hover {
            background-color: $color-neutral-2;
        }
    }

    .trending-rank {
        flex: 0 0 20px;
        color: #9499a0;
        font-size: 14px;
        font-weight: 600;
        text-align: center;
    }

    .trending-item:nth-child(-n + 3) .trending-rank {
        color: $color-brand-pink;
    }

    .trending-title {
        min-width: 0;
        color: inherit;
        font-size: 14px;
        line-height: 20px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
}

.search-panel-fade-enter-active,
.search-panel-fade-leave-active {
    transition: opacity 0.16s ease, transform 0.16s ease;
}

.search-panel-fade-enter-from,
.search-panel-fade-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}
</style>
