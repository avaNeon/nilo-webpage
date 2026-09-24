<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';
import { useSearchBar } from '@/shared/features/searchBar/model/useSearchBar';

const {
    searchPanelVisible,
    searchKeyword,
    searchHistoryList,
    searchHistoryExpanded,
    searchHistoryExpandable,
    hotKeywordList,
    searchVideo,
    showSearchPanel,
    hideSearchPanel,
    toggleSearchHistoryExpanded,
} = useSearchBar({ openInNewPage: true });

const searchInputRef = useTemplateRef<HTMLInputElement>('searchInputRef');
const inputFocused = ref(false);
// Mac 显示 ⌘K，其余平台显示 Ctrl K
const shortcutText = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent) ? '⌘K' : 'Ctrl K';

/** 搜索并收起面板；关键词为空时只聚焦输入框 */
function submitSearch(keyword?: string)
{
    if (!(keyword ?? searchKeyword.value).trim())
    {
        searchInputRef.value?.focus();
        return;
    }
    searchVideo(keyword);
    hideSearchPanel();
    searchInputRef.value?.blur();
}

function onFocus()
{
    inputFocused.value = true;
    showSearchPanel();
}

function onEnter(event: KeyboardEvent)
{
    // 输入法组字时的回车只用于上屏
    if (event.isComposing)
    {
        return;
    }
    submitSearch();
}

function onEscape()
{
    hideSearchPanel();
    searchInputRef.value?.blur();
}

// Ctrl/⌘ + K 聚焦搜索框
function onGlobalKeydown(event: KeyboardEvent)
{
    if ((event.ctrlKey || event.metaKey) && event.key?.toLowerCase() === 'k')
    {
        event.preventDefault();
        searchInputRef.value?.focus();
        searchInputRef.value?.select();
    }
}

onMounted(() =>
{
    window.addEventListener('keydown', onGlobalKeydown);
})

onBeforeUnmount(() =>
{
    window.removeEventListener('keydown', onGlobalKeydown);
})
</script>

<template>
    <div ref="searchBarRef" class="site-search" :class="{ active: searchPanelVisible }">
        <div class="search-box">
            <button type="button" class="search-icon" aria-label="搜索" @click="submitSearch()">
                <span class="search-icon-ring"></span>
                <span class="search-icon-handle"></span>
            </button>
            <input ref="searchInputRef" v-model="searchKeyword" class="search-input" type="text"
                placeholder="搜索你想看的视频" autocomplete="off" @focus="onFocus" @blur="inputFocused = false"
                @keydown.enter="onEnter" @keydown.esc="onEscape">
            <kbd v-show="!inputFocused" class="search-shortcut">{{ shortcutText }}</kbd>
        </div>
        <Transition name="site-search-panel">
            <div v-if="searchPanelVisible" class="search-panel">
                <section v-if="searchHistoryList.length > 0" class="panel-section">
                    <div class="panel-head">
                        <span class="panel-title">搜索历史</span>
                        <button v-if="searchHistoryExpandable" type="button" class="panel-toggle"
                            @click="toggleSearchHistoryExpanded">
                            {{ searchHistoryExpanded ? '收起' : '展开更多' }}
                        </button>
                    </div>
                    <div ref="historyListRef" class="history-list" :class="{ collapsed: !searchHistoryExpanded }">
                        <button v-for="item in searchHistoryList" :key="item" type="button" class="history-chip"
                            :title="item" @click="submitSearch(item)">
                            {{ item }}
                        </button>
                    </div>
                </section>
                <section class="panel-section">
                    <div class="panel-head">
                        <span class="panel-title">热搜</span>
                    </div>
                    <div v-if="hotKeywordList.length > 0" class="trending-list">
                        <button v-for="(item, index) in hotKeywordList" :key="item" type="button" class="trending-item"
                            :title="item" @click="submitSearch(item)">
                            <span :class="['trending-rank', { top: index < 3 }]">{{ index + 1 }}</span>
                            <span class="trending-title">{{ item }}</span>
                        </button>
                    </div>
                    <div v-else class="trending-empty">暂无热搜</div>
                </section>
            </div>
        </Transition>
    </div>
</template>

<style lang="scss" scoped>
.site-search {
    position: relative;
    flex-shrink: 0;
    width: 340px;
    font-family: $warm-font-sans;

    // 按钮统一去掉默认样式
    button {
        padding: 0;
        border: none;
        background: transparent;
        font: inherit;
        color: inherit;
        cursor: pointer;
    }

    .search-box {
        display: flex;
        align-items: center;
        gap: 10px;
        height: 40px;
        padding: 0 8px 0 14px;
        background: #FFFFFF;
        border: 1px solid $warm-border;
        border-radius: 12px;
        box-shadow: 0 1px 2px rgba(26, 25, 22, 0.03);
        transition: border-color 0.2s;

        &:focus-within {
            border-color: rgba(26, 25, 22, 0.2);
        }
    }

    // 放大镜：圆环 + 斜柄
    .search-icon {
        position: relative;
        width: 13px;
        height: 13px;
        flex-shrink: 0;

        // 扩大点击区域
        &::before {
            content: '';
            position: absolute;
            inset: -8px;
        }

        .search-icon-ring {
            position: absolute;
            left: 0;
            top: 0;
            width: 9px;
            height: 9px;
            border: 1.5px solid $warm-ink-4;
            border-radius: 50%;
            box-sizing: border-box;
        }

        .search-icon-handle {
            position: absolute;
            left: 8px;
            top: 9px;
            width: 5px;
            height: 1.5px;
            background: $warm-ink-4;
            transform: rotate(45deg);
        }

        &:hover span {
            border-color: $warm-ink;
        }

        &:hover .search-icon-handle {
            background: $warm-ink;
        }
    }

    .search-input {
        flex: 1;
        min-width: 0;
        height: 100%;
        padding: 0;
        border: none;
        outline: none;
        background: transparent;
        font-size: 13px;
        color: $warm-ink;

        &::placeholder {
            color: $warm-ink-4;
        }
    }

    .search-shortcut {
        flex-shrink: 0;
        padding: 2px 6px;
        border: 1px solid rgba(26, 25, 22, 0.1);
        border-radius: 6px;
        font-family: $warm-font-mono;
        font-size: 11px;
        color: $warm-ink-4;
    }

    .search-panel {
        position: absolute;
        top: 48px;
        right: 0;
        z-index: 10;
        width: 420px;
        padding: 18px;
        background: #FFFFFF;
        border-radius: 16px;
        box-shadow: $warm-shadow-card, 0 18px 40px -20px rgba(26, 25, 22, 0.25);
    }

    .panel-section+.panel-section {
        margin-top: 18px;
    }

    .panel-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
    }

    .panel-title {
        font-size: 12px;
        font-weight: 600;
        color: $warm-ink-3;
    }

    .panel-toggle {
        font-size: 12px;
        color: $warm-ink-4;
        transition: color 0.2s;

        &:hover {
            color: $warm-ink;
        }
    }

    .history-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        // 收起时最多两行
        &.collapsed {
            max-height: 64px;
            overflow: hidden;
        }
    }

    .history-chip {
        max-width: 100%;
        padding: 5px 11px;
        border-radius: 8px;
        background: $warm-paper;
        font-size: 12px;
        line-height: 18px;
        color: $warm-ink-3;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        transition: color 0.2s;

        &:hover {
            color: $warm-ink;
        }
    }

    .trending-list {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 2px 8px;
    }

    .trending-item {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
        padding: 7px 8px;
        border-radius: 8px;
        text-align: left;
        transition: background 0.2s;

        &:hover {
            background: $warm-paper;
        }
    }

    .trending-rank {
        flex: 0 0 16px;
        font-family: $warm-font-mono;
        font-size: 12px;
        color: $warm-ink-5;

        &.top {
            color: $warm-accent-strong;
        }
    }

    .trending-title {
        min-width: 0;
        font-size: 13px;
        color: $warm-ink;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .trending-empty {
        padding: 6px 0;
        font-size: 13px;
        color: $warm-ink-4;
    }
}

.site-search-panel-enter-active,
.site-search-panel-leave-active {
    transition: opacity 0.16s ease, transform 0.16s ease;
}

.site-search-panel-enter-from,
.site-search-panel-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}
</style>
