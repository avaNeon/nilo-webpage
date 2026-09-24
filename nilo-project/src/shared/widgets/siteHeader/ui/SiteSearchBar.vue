<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';
import { useSearchBar } from '@/shared/features/searchBar/model/useSearchBar';

const props = withDefaults(defineProps<{
    /** 搜索页用的大号搜索框：带清空和「搜索」按钮 */
    large?: boolean,
    /** 搜索结果在新标签页打开；搜索页里直接跳转 */
    openInNewPage?: boolean,
}>(), {
    large: false,
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
    hideSearchPanel,
    toggleSearchHistoryExpanded,
} = useSearchBar({ openInNewPage: props.openInNewPage });

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

function clearKeyword()
{
    searchKeyword.value = '';
    searchInputRef.value?.focus();
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
    <div ref="searchBarRef" class="site-search" :class="{ active: searchPanelVisible, large }">
        <div class="search-box">
            <button type="button" class="search-icon" aria-label="搜索" @click="submitSearch()">
                <span class="search-icon-ring"></span>
                <span class="search-icon-handle"></span>
            </button>
            <input ref="searchInputRef" v-model="searchKeyword" class="search-input" type="text"
                placeholder="搜索你想看的视频" autocomplete="off" @focus="onFocus" @blur="inputFocused = false"
                @keydown.enter="onEnter" @keydown.esc="onEscape">
            <template v-if="large">
                <button v-show="searchKeyword" type="button" class="clear-button" aria-label="清空"
                    @click="clearKeyword">×</button>
                <button type="button" class="submit-button" @click="submitSearch()">搜索</button>
            </template>
            <kbd v-else v-show="!inputFocused" class="search-shortcut">{{ shortcutText }}</kbd>
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
    width: 360px;
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
        height: 42px;
        padding: 0 8px 0 16px;
        background: $warm-sunken;
        border-radius: 999px;
        transition: background-color 0.2s, box-shadow 0.2s;

        &:focus-within {
            background: #FFFFFF;
            box-shadow: inset 0 0 0 1.5px $warm-accent;
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
        padding: 3px 8px;
        border-radius: 999px;
        background: #FFFFFF;
        font-family: $warm-font-mono;
        font-size: 11px;
        color: $warm-ink-4;
    }

    .search-panel {
        position: absolute;
        top: 54px;
        left: 0;
        z-index: 10;
        width: 452px;
        padding: 20px;
        background: #FFFFFF;
        border-radius: 26px;
        box-shadow: $warm-shadow-card;
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
        padding: 5px 12px;
        border-radius: 999px;
        background: $warm-sunken;
        font-size: 12px;
        line-height: 18px;
        color: $warm-ink-3;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        transition: color 0.2s;

        &:hover {
            color: $warm-accent;
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
        padding: 7px 10px;
        border-radius: 12px;
        text-align: left;
        transition: background 0.2s;

        &:hover {
            background: $warm-sunken;
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

/*——————大号：搜索页顶部，760 宽、60 高，右侧清空 + 搜索按钮—————— */

.site-search.large {
    width: 760px;

    .search-box {
        gap: 14px;
        height: 60px;
        padding: 0 6px 0 24px;
    }

    .search-icon {
        width: 15px;
        height: 15px;

        .search-icon-ring {
            width: 11px;
            height: 11px;
            border-width: 1.75px;
            border-color: $warm-ink-3;
        }

        .search-icon-handle {
            left: 9px;
            top: 11px;
            width: 6px;
            height: 1.75px;
            background: $warm-ink-3;
        }
    }

    .search-input {
        font-size: 16px;
        font-weight: 500;
    }

    .clear-button {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: #FFFFFF;
        color: $warm-ink-4;
        font-size: 15px;
        line-height: 1;
        transition: color 0.2s, background-color 0.2s;

        &:hover {
            color: $warm-ink;
        }
    }

    // 聚焦时底色变白，清空按钮换成浅灰才看得见
    .search-box:focus-within .clear-button {
        background: $warm-sunken;
    }

    .submit-button {
        flex-shrink: 0;
        height: 48px;
        padding: 0 26px;
        border-radius: 999px;
        background: $warm-accent;
        color: #FFFFFF;
        font-size: 14px;
        font-weight: 600;
        transition: background-color 0.2s;

        &:hover {
            background: $warm-ink;
        }

        &:focus-visible {
            outline: 2px solid $warm-accent;
            outline-offset: 2px;
        }
    }

    .search-panel {
        top: 70px;
        width: 100%;
    }
}
</style>
