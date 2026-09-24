<script setup lang="ts">
import Avatar from '@/shared/entities/avatar/ui/Avatar.vue';
import AiAssistant from '@/shared/features/aiAssistant/ui/AiAssistant.vue';
import { imgRequestUrl } from '@/shared/utils/ImgUtil';
import { computed, inject, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';
import { useRoute } from 'vue-router';
import { useHeaderNav } from '../model/useHeaderNav';
import SiteSearchBar from './SiteSearchBar.vue';

withDefaults(defineProps<{
    /** 搜索框旁边显示「AI 搜索」按钮（首页用） */
    aiSearch?: boolean,
}>(), {
    aiSearch: false,
})

const mainContentMaxWidth: number = inject('mainContentMaxWidth', 0)
const mainContentMinWidth: number = inject('mainContentMinWidth', 0)

const route = useRoute()

const {
    loginStateStore,
    uncheckedMessageCount,
    uncheckedMessageCountText,
    requireLoginThen,
} = useHeaderNav()

/** 首页和分类页都算「主页」 */
const isHomeRoute = computed(() => route.name === 'index' || route.name === 'category')
const isHistoryRoute = computed(() => route.name === 'history')

const messageLabel = computed(() =>
    uncheckedMessageCount.value > 0 ? `消息（${uncheckedMessageCountText.value} 条未读）` : '消息')

/*——————滚动后才显示底部分隔线—————— */

const scrolled = ref(false)

function onScroll()
{
    scrolled.value = window.scrollY > 0
}

/*——————AI 搜索弹层：点外面或按 Esc 关闭，关了不清空对话—————— */

const aiSearchOpen = ref(false)
const aiSearchRef = useTemplateRef<HTMLDivElement>('aiSearchRef')

function onDocumentPointerDown(event: PointerEvent)
{
    if (aiSearchOpen.value && !aiSearchRef.value?.contains(event.target as Node))
    {
        aiSearchOpen.value = false
    }
}

function onDocumentKeydown(event: KeyboardEvent)
{
    if (event.key === 'Escape')
    {
        aiSearchOpen.value = false
    }
}

onMounted(() =>
{
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('pointerdown', onDocumentPointerDown)
    document.addEventListener('keydown', onDocumentKeydown)
})

onBeforeUnmount(() =>
{
    window.removeEventListener('scroll', onScroll)
    document.removeEventListener('pointerdown', onDocumentPointerDown)
    document.removeEventListener('keydown', onDocumentKeydown)
})
</script>

<template>
    <header :class="['site-header', { scrolled }]">
        <div class="site-header-inner" :style="{
            'max-width': mainContentMaxWidth + 'px',
            'min-width': mainContentMinWidth + 'px',
        }">
            <RouterLink to="/" class="brand">
                <span class="brand-mark"></span>
                <span class="brand-name">nilo</span>
                <span class="brand-tag">VIDEO</span>
            </RouterLink>

            <nav class="nav">
                <RouterLink to="/" :class="['nav-item', { active: isHomeRoute }]"
                    :aria-current="isHomeRoute ? 'page' : undefined">
                    主页<span class="nav-dot"></span>
                </RouterLink>
                <button type="button" class="nav-item"
                    @click="requireLoginThen(() => `/user/${loginStateStore.userInfo!.userId}/collection`)">
                    收藏<span class="nav-dot"></span>
                </button>
                <button type="button" :class="['nav-item', { active: isHistoryRoute }]"
                    :aria-current="isHistoryRoute ? 'page' : undefined"
                    @click="requireLoginThen(() => `/history/${loginStateStore.userInfo!.userId}`)">
                    历史<span class="nav-dot"></span>
                </button>
                <button type="button" class="nav-item" @click="requireLoginThen('/cc')">
                    创作中心<span class="nav-dot"></span>
                </button>
            </nav>

            <div ref="aiSearchRef" class="search-group">
                <SiteSearchBar />
                <template v-if="aiSearch">
                    <button type="button" :class="['ai-search-button', { open: aiSearchOpen }]"
                        :aria-expanded="aiSearchOpen" aria-haspopup="dialog" @click="aiSearchOpen = !aiSearchOpen">
                        <span class="ai-mark" aria-hidden="true"></span>AI 搜索
                    </button>
                    <Transition name="ai-search-pop">
                        <!-- v-show：关掉再打开还能接着聊 -->
                        <div v-show="aiSearchOpen" class="ai-search-popover" role="dialog" aria-label="AI 搜索">
                            <AiAssistant embedded closable title="AI 搜索" subtitle="用一句话找到想看的"
                                @close="aiSearchOpen = false" />
                        </div>
                    </Transition>
                </template>
            </div>

            <div class="spacer"></div>

            <div class="actions">
                <div class="avatar-slot">
                    <Avatar :src="loginStateStore.userInfo ? imgRequestUrl(loginStateStore.userInfo.avatar, true) : ''"
                        :user-id="loginStateStore.userInfo ? loginStateStore.userInfo.userId : null" :lazy="false"
                        :width="42">
                    </Avatar>
                </div>
                <button type="button" class="message-button" :aria-label="messageLabel" :title="messageLabel"
                    @click="requireLoginThen('/message/1')">
                    <span class="bell" aria-hidden="true"></span>
                    <Transition name="badge-pop">
                        <span v-if="uncheckedMessageCount > 0" class="message-badge" aria-hidden="true">
                            {{ uncheckedMessageCountText }}
                        </span>
                    </Transition>
                </button>
                <button type="button" class="upload-button" @click="requireLoginThen('/cc/upload')">
                    <span class="upload-plus">+</span>投稿
                </button>
            </div>
        </div>
    </header>
</template>

<style lang="scss" scoped>
.site-header {
    position: sticky;
    top: 0;
    z-index: 600;
    width: 100%;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: saturate(1.2) blur(12px);
    -webkit-backdrop-filter: saturate(1.2) blur(12px);
    // 页面顶部时不画分隔线，滚动后内容从顶栏下面经过才显示
    border-bottom: 1px solid transparent;
    color: $warm-ink;
    -webkit-font-smoothing: antialiased;
    font-feature-settings: 'tnum';
    transition: border-color 0.2s;

    &.scrolled {
        border-bottom-color: $warm-line-soft;
    }

    // 不依赖外层 .warm-theme，自带字体
    &,
    :deep(*) {
        font-family: $warm-font-sans;
    }

    .site-header-inner {
        display: flex;
        align-items: center;
        gap: 44px;
        height: $warm-header-height;
        margin: 0 auto;
        padding: 0 48px;
    }

    button {
        padding: 0;
        border: none;
        background: transparent;
        font: inherit;
        color: inherit;
        cursor: pointer;
    }

    .brand {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-shrink: 0;
        color: $warm-ink;
        text-decoration: none;
    }

    // 蓝色圆 + 偏右上的白点
    .brand-mark {
        position: relative;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: $warm-accent;

        &::after {
            content: '';
            position: absolute;
            left: 15px;
            top: 6px;
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #FFFFFF;
        }
    }

    .brand-name {
        font-size: 19px;
        font-weight: 800;
        letter-spacing: 0.02em;
    }

    .brand-tag {
        padding-top: 2px;
        font-family: $warm-font-mono;
        font-size: 10px;
        letter-spacing: 0.2em;
        color: $warm-ink-4;
    }

    .nav {
        display: flex;
        gap: 30px;
        height: $warm-header-height;
        flex-shrink: 0;
    }

    .nav-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 5px;
        padding-top: 9px;
        font-size: 14px;
        font-weight: 500;
        color: $warm-ink-4;
        text-decoration: none;
        white-space: nowrap;
        transition: color 0.2s;

        &:hover,
        &:focus-visible {
            color: $warm-ink;
            outline: none;
        }

        &.active {
            font-weight: 600;
            color: $warm-accent;

            .nav-dot {
                background: $warm-accent;
            }
        }
    }

    .nav-dot {
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: transparent;
        transition: background 0.2s;
    }

    .search-group {
        position: relative;
        display: flex;
        align-items: center;
        gap: 10px;
        flex-shrink: 0;
    }

    .ai-search-button {
        display: flex;
        align-items: center;
        gap: 8px;
        height: 42px;
        padding: 0 16px 0 8px;
        border-radius: 999px;
        background: $warm-accent-soft;
        color: $warm-accent;
        font-size: 13px;
        font-weight: 600;
        white-space: nowrap;
        transition: background-color 0.2s, color 0.2s;

        .ai-mark {
            position: relative;
            width: 26px;
            height: 26px;
            border-radius: 50%;
            background: $warm-accent;
            transition: background-color 0.2s;

            &::after {
                content: '';
                position: absolute;
                left: 14px;
                top: 6px;
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: #FFFFFF;
                transition: background-color 0.2s;
            }
        }

        &.open {
            background: $warm-accent;
            color: #FFFFFF;

            .ai-mark {
                background: #FFFFFF;

                &::after {
                    background: $warm-accent;
                }
            }
        }

        &:focus-visible {
            outline: 2px solid $warm-accent;
            outline-offset: 2px;
        }
    }

    .ai-search-popover {
        position: absolute;
        left: 0;
        top: 54px;
        z-index: 30;
        width: 452px;
        border-radius: 26px;
        background: #FFFFFF;
        box-shadow: $warm-shadow-card;
        --ai-message-max-height: 340px;
    }

    .spacer {
        flex: 1;
        min-width: 0;
    }

    .actions {
        display: flex;
        align-items: center;
        gap: 24px;
        flex-shrink: 0;
    }

    .avatar-slot {
        display: flex;
        align-items: center;
        height: 42px;

        :deep(.onLogin > .avatar) {
            display: block;
        }

        :deep(.onLogin .image-container) {
            border-color: rgba(11, 12, 18, 0.08) !important;
        }

        // 面板位置沿用 Avatar 自己的居中逻辑（悬停后头像正好落在面板顶边中点），这里只换外观
        :deep(.onLogin .user-panel) {
            border-radius: 16px;
            box-shadow: $warm-shadow-card;
        }
    }

    // 消息：浅灰圆底 + 线条铃铛，有未读时右上角一个蓝色数字角标
    .message-button {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 42px;
        height: 42px;
        border-radius: 50%;
        background: $warm-sunken;
        color: $warm-ink-3;
        transition: background-color 0.2s, color 0.2s;

        &:hover {
            background: $warm-accent-soft;
            color: $warm-accent;
        }

        &:focus-visible {
            outline: 2px solid $warm-accent;
            outline-offset: 2px;
        }

        .bell {
            width: 14px;
            height: 14px;
            border: 1.5px solid currentColor;
            border-radius: 7px 7px 3px 3px;
        }

        // 左边固定，位数多了往右长，不会盖住铃铛
        .message-badge {
            position: absolute;
            left: 25px;
            top: -4px;
            min-width: 18px;
            height: 18px;
            padding: 0 5px;
            border-radius: 999px;
            background: $warm-accent;
            box-shadow: 0 0 0 2px #FFFFFF;
            color: #FFFFFF;
            font-size: 11px;
            font-weight: 700;
            line-height: 18px;
            text-align: center;
            white-space: nowrap;
            pointer-events: none;
        }
    }

    .upload-button {
        display: flex;
        align-items: center;
        gap: 8px;
        height: 42px;
        padding: 0 20px;
        border-radius: 999px;
        background: $warm-ink;
        color: #FFFFFF;
        font-size: 13px;
        font-weight: 500;
        transition: background 0.2s;

        &:hover {
            background: $warm-accent;
        }
    }

    .upload-plus {
        font-size: 16px;
        font-weight: 400;
        line-height: 1;
    }
}

.ai-search-pop-enter-active,
.ai-search-pop-leave-active {
    transition: opacity 0.16s ease, transform 0.16s ease;
}

.ai-search-pop-enter-from,
.ai-search-pop-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}

.badge-pop-enter-active {
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s;
}

.badge-pop-leave-active {
    transition: transform 0.15s ease, opacity 0.15s ease;
}

.badge-pop-enter-from,
.badge-pop-leave-to {
    opacity: 0;
    transform: scale(0.4);
}
</style>
