<script setup lang="ts">
import Avatar from '@/shared/entities/avatar/ui/Avatar.vue';
import AiAssistant from '@/shared/features/aiAssistant/ui/AiAssistant.vue';
import { imgRequestUrl } from '@/shared/utils/ImgUtil';
import { computed, inject, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useHeaderNav } from '../model/useHeaderNav';
import SiteSearchBar from './SiteSearchBar.vue';

const props = withDefaults(defineProps<{
    /** 搜索框旁边显示「AI 搜索」按钮（首页用） */
    aiSearch?: boolean,
    /** 不显示顶栏搜索框（搜索页自己有大搜索框） */
    hideSearch?: boolean,
    /** 液态玻璃：悬浮的毛玻璃胶囊，底下的壁纸透上来（个人主页用） */
    glass?: boolean,
    /** 蓝底白字（创作中心用），元素位置和白底顶栏完全一样 */
    blue?: boolean,
}>(), {
    aiSearch: false,
    hideSearch: false,
    glass: false,
    blue: false,
})

const mainContentMaxWidth: number = inject('mainContentMaxWidth', 0)
const mainContentMinWidth: number = inject('mainContentMinWidth', 0)

/** 玻璃胶囊左右各缩进 24px，和下面内容的 48px 边距错开 */
const GLASS_INSET = 24
const innerStyle = computed(() =>
{
    const inset = props.glass ? GLASS_INSET * 2 : 0
    return {
        'max-width': mainContentMaxWidth - inset + 'px',
        'min-width': mainContentMinWidth - inset + 'px',
    }
})

const route = useRoute()
const creativeCenterHref = useRouter().resolve('/cc').href
const aboutHref = useRouter().resolve({ name: 'about' }).href

const {
    loginStateStore,
    uncheckedMessageCount,
    uncheckedMessageCountText,
    requireLoginThen,
} = useHeaderNav()

/** 首页和分类页都算「主页」 */
const isHomeRoute = computed(() => route.name === 'index' || route.name === 'category')
const isHotRoute = computed(() => route.name === 'hot-ranking')
const isCreativeCenterRoute = computed(() => route.matched.some(record => record.name === 'creativeCenter'))
const isHistoryRoute = computed(() => route.name === 'history')
const isMessageRoute = computed(() => route.name === 'messageCenter')
/** 只有看自己的收藏时才算，看别人的收藏不点亮 */
const isMyCollectionRoute = computed(() =>
    route.name === 'userCollection' && !!loginStateStore.userInfo
    && route.params.userId === loginStateStore.userInfo.userId)

const messageLabel = computed(() =>
    uncheckedMessageCount.value > 0 ? `消息（${uncheckedMessageCountText.value} 条未读）` : '消息')

const avatarSrc = computed(() => loginStateStore.userInfo ? imgRequestUrl(loginStateStore.userInfo.avatar, true) : '')
const avatarUserId = computed(() => loginStateStore.userInfo ? loginStateStore.userInfo.userId : null)

/** 创作中心要登录：没登录弹登录面板；登录了就在当前页切过去（中键、Ctrl 点击照常开新标签页） */
function openCreativeCenter(event: MouseEvent)
{
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    requireLoginThen('/cc', { sameTab: true })
}

/** 投稿：已经在创作中心里就直接切过去，别的页面照旧开新标签页 */
function openUpload()
{
    requireLoginThen('/cc/upload', { sameTab: isCreativeCenterRoute.value })
}

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
    <header :class="['site-header', { scrolled, glass, blue }]">
        <div class="site-header-inner" :style="innerStyle">
            <a class="brand" :href="aboutHref" target="_blank" rel="noopener noreferrer" aria-label="关于光点">
                <span class="brand-mark"></span>
                <span class="brand-name">nilo</span>
                <span class="brand-tag">VIDEO</span>
            </a>

            <nav class="nav">
                <RouterLink to="/" :class="['nav-item', { active: isHomeRoute }]"
                    :aria-current="isHomeRoute ? 'page' : undefined">
                    主页<span class="nav-dot"></span>
                </RouterLink>
                <RouterLink to="/popular" :class="['nav-item', { active: isHotRoute }]"
                    :aria-current="isHotRoute ? 'page' : undefined">
                    热门<span class="nav-dot"></span>
                </RouterLink>
                <a :href="creativeCenterHref" :class="['nav-item', { active: isCreativeCenterRoute }]"
                    :aria-current="isCreativeCenterRoute ? 'page' : undefined" @click="openCreativeCenter">
                    创作中心<span class="nav-dot"></span>
                </a>
            </nav>

            <div v-if="!hideSearch" ref="aiSearchRef" class="search-group">
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

            <!-- 普通顶栏头像在最左；玻璃顶栏按设计稿放在投稿按钮前面 -->
            <div class="actions">
                <div v-if="!glass" class="avatar-slot">
                    <Avatar :src="avatarSrc" :user-id="avatarUserId" :lazy="false" :width="42"></Avatar>
                </div>
                <button type="button" :class="['icon-button', 'message-button', { active: isMessageRoute }]"
                    :aria-label="messageLabel" :title="messageLabel"
                    :aria-current="isMessageRoute ? 'page' : undefined" @click="requireLoginThen('/message/1')">
                    <span class="bell" aria-hidden="true"></span>
                    <Transition name="badge-pop">
                        <span v-if="uncheckedMessageCount > 0" class="message-badge" aria-hidden="true">
                            {{ uncheckedMessageCountText }}
                        </span>
                    </Transition>
                </button>
                <button type="button" :class="['icon-button', { active: isMyCollectionRoute }]" aria-label="收藏"
                    title="收藏" :aria-current="isMyCollectionRoute ? 'page' : undefined"
                    @click="requireLoginThen(() => `/user/${loginStateStore.userInfo!.userId}/collection`)">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"
                        stroke-linejoin="round" aria-hidden="true">
                        <path d="M8 1.8l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6z" />
                    </svg>
                </button>
                <button type="button" :class="['icon-button', { active: isHistoryRoute }]" aria-label="历史记录"
                    title="历史" :aria-current="isHistoryRoute ? 'page' : undefined"
                    @click="requireLoginThen(() => `/history/${loginStateStore.userInfo!.userId}`)">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"
                        stroke-linecap="round" aria-hidden="true">
                        <circle cx="8" cy="8" r="6.2" />
                        <path d="M8 4.8V8l2.2 1.5" />
                    </svg>
                </button>
                <div v-if="glass" class="avatar-slot">
                    <Avatar :src="avatarSrc" :user-id="avatarUserId" :lazy="false" :width="44"></Avatar>
                </div>
                <button type="button" class="upload-button" @click="openUpload">
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
    // 主页 / 热门 / 创作中心互相切换时，顶栏单独做一层淡入淡出，位置不动只换颜色
    view-transition-name: site-header;

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

    // 消息 / 收藏 / 历史：浅灰圆底 + 线条图标；正在对应页面时浅蓝底 + 蓝色图标
    .icon-button {
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
            background: $warm-sunken-hover;
        }

        &.active {
            background: $warm-accent-soft;
            color: $warm-accent;
        }

        &:focus-visible {
            outline: 2px solid $warm-accent;
            outline-offset: 2px;
        }
    }

    // 有未读时右上角一个蓝色数字角标
    .message-button {
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

/*——————液态玻璃（个人主页）：悬浮胶囊，下面的壁纸透上来—————— */

.site-header.glass {
    top: 16px;
    margin-top: 16px;
    padding: 0 24px;
    background: transparent;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    border-bottom: none;

    .site-header-inner {
        gap: 36px;
        height: 68px;
        padding: 0 12px 0 24px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.4);
        backdrop-filter: blur(28px) saturate(1.8);
        -webkit-backdrop-filter: blur(28px) saturate(1.8);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9), inset 0 0 0 1px rgba(255, 255, 255, 0.45), 0 20px 50px -28px rgba(11, 12, 18, 0.4);
    }

    .brand-tag {
        color: $warm-ink-3;
    }

    // 玻璃胶囊里导航是一行纯文字，不带下面的小圆点
    .nav {
        gap: 28px;
        height: auto;
    }

    .nav-item {
        padding-top: 0;
        color: $warm-ink-3;

        &:hover,
        &:focus-visible {
            color: $warm-ink;
        }

        &.active {
            color: $warm-accent;
        }
    }

    .nav-dot {
        display: none;
    }

    :deep(.site-search) {
        width: 340px;
    }

    :deep(.site-search .search-box) {
        height: 44px;
        background: rgba(255, 255, 255, 0.45);
        box-shadow: inset 0 1px 2px rgba(11, 12, 18, 0.08), inset 0 0 0 1px rgba(255, 255, 255, 0.6);

        &:focus-within {
            background: #FFFFFF;
            box-shadow: inset 0 0 0 1.5px $warm-accent;
        }
    }

    :deep(.site-search .search-shortcut) {
        background: rgba(255, 255, 255, 0.7);
        color: $warm-ink-3;
    }

    .actions {
        gap: 12px;
    }

    .icon-button {
        width: 44px;
        height: 44px;
        background: rgba(255, 255, 255, 0.5);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9), inset 0 0 0 1px rgba(255, 255, 255, 0.5);

        &:hover {
            background: rgba(255, 255, 255, 0.75);
        }

        &.active {
            background: rgba(255, 255, 255, 0.85);
            color: $warm-accent;
        }
    }

    // 头像外面一圈白边，不用普通顶栏的灰描边
    .avatar-slot {
        height: 44px;

        :deep(.onLogin .image-container) {
            border: none !important;
            box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.8);
        }
    }

    .upload-button {
        height: 44px;
    }
}

/*——————蓝底（创作中心）：尺寸、位置全都不变，只换颜色—————— */

.site-header.blue {
    background: rgba(0, 0, 242, 0.92);
    color: #FFFFFF;

    &.scrolled {
        border-bottom-color: rgba(255, 255, 255, 0.14);
    }

    .brand {
        color: #FFFFFF;
    }

    // 白圆 + 蓝点，和白底顶栏反过来
    .brand-mark {
        background: #FFFFFF;

        &::after {
            background: $warm-accent;
        }
    }

    .brand-tag {
        color: $warm-accent-on-dark-2;
    }

    .nav-item {
        color: $warm-accent-on-dark-2;

        &:hover,
        &:focus-visible {
            color: #FFFFFF;
        }

        &.active {
            color: #FFFFFF;

            .nav-dot {
                background: #FFFFFF;
            }
        }
    }

    // 半透明白底 + 白色细描边；点进去输入时变回白底深色字
    :deep(.site-search .search-box) {
        background: rgba(255, 255, 255, 0.12);
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.5);

        .search-icon-ring {
            border-color: $warm-accent-on-dark-2;
        }

        .search-icon-handle {
            background: $warm-accent-on-dark-2;
        }

        .search-input {
            color: #FFFFFF;

            &::placeholder {
                color: $warm-accent-on-dark-2;
            }
        }

        .search-shortcut {
            background: rgba(255, 255, 255, 0.16);
            color: #FFFFFF;
        }

        &:focus-within {
            background: #FFFFFF;
            box-shadow: inset 0 0 0 1.5px #FFFFFF;

            .search-icon-ring {
                border-color: $warm-ink-4;
            }

            .search-icon-handle {
                background: $warm-ink-4;
            }

            .search-input {
                color: $warm-ink;

                &::placeholder {
                    color: $warm-ink-4;
                }
            }
        }
    }

    .avatar-slot :deep(.onLogin .image-container) {
        border: none !important;
        box-shadow: 0 0 0 2px #FFFFFF;
    }

    .icon-button {
        background: rgba(255, 255, 255, 0.12);
        color: #FFFFFF;

        &:hover {
            background: rgba(255, 255, 255, 0.22);
        }

        &.active {
            background: #FFFFFF;
            color: $warm-accent;
        }

        &:focus-visible {
            outline-color: #FFFFFF;
        }
    }

    // 角标反色：白底蓝字，外圈用蓝色和底色断开
    .message-badge {
        background: #FFFFFF;
        box-shadow: 0 0 0 2px $warm-accent;
        color: $warm-accent;
    }

    .upload-button {
        background: #FFFFFF;
        color: $warm-accent;

        &:hover {
            background: $warm-accent-soft;
        }
    }
}
</style>
