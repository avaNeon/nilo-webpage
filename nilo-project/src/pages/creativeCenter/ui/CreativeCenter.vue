<script lang="ts" setup>
import { inject, onBeforeUnmount, onMounted, reactive } from 'vue';
import { useRoute } from 'vue-router';
import SiteHeader from '@/shared/widgets/siteHeader/ui/SiteHeader.vue';

// 获取内容部分最大最小宽度
const mainContentMaxWidth: number = inject('mainContentMaxWidth', 0)
const mainContentMinWidth: number = inject('mainContentMinWidth', 0)

const route = useRoute()

interface NavLink
{
    label: string,
    routeName: string,
    to: string,
}

const HOME_LINK: NavLink = { label: '首页', routeName: 'ccIndexPage', to: '/cc/home' }

const NAV_GROUPS: { key: string, label: string, links: NavLink[] }[] = [
    {
        key: 'content',
        label: '内容管理',
        links: [{ label: '稿件管理', routeName: 'videoManagement', to: '/cc/video' }],
    },
    {
        key: 'interaction',
        label: '互动管理',
        links: [
            { label: '评论管理', routeName: 'videoCommentManagement', to: '/cc/comment' },
            { label: '弹幕管理', routeName: 'danmakuManagement', to: '/cc/danmaku' },
        ],
    },
]

/** 分组默认展开，点分组标题收起 */
const collapsedGroups = reactive<Record<string, boolean>>({})

function isActive(link: NavLink)
{
    return route.name === link.routeName
}

/*——————整页蓝底：页面比窗口短时，滚动条留出的那一条也要是蓝的—————— */

const ROOT_CLASS = 'creative-center-open'

onMounted(() => document.documentElement.classList.add(ROOT_CLASS))
onBeforeUnmount(() => document.documentElement.classList.remove(ROOT_CLASS))
</script>

<template>
    <div class="creative-center-page warm-theme">
        <SiteHeader blue />

        <main class="cc-main" :style="{
            'max-width': mainContentMaxWidth + 'px',
            'min-width': mainContentMinWidth + 'px',
        }">
            <aside class="cc-aside">
                <div class="aside-title">
                    <span class="title">创作中心</span>
                    <span class="title-tag">CREATOR STUDIO</span>
                </div>

                <RouterLink to="/cc/upload" :class="['upload-button', { active: route.name === 'videoUpload' }]"
                    :aria-current="route.name === 'videoUpload' ? 'page' : undefined">
                    <span class="upload-plus" aria-hidden="true">+</span>投稿
                </RouterLink>

                <nav class="cc-nav" aria-label="创作中心">
                    <RouterLink :to="HOME_LINK.to" :class="['nav-link', { active: isActive(HOME_LINK) }]"
                        :aria-current="isActive(HOME_LINK) ? 'page' : undefined">
                        <span class="nav-dot" aria-hidden="true"></span>{{ HOME_LINK.label }}
                    </RouterLink>

                    <template v-for="group in NAV_GROUPS" :key="group.key">
                        <button type="button" class="group-toggle" :aria-expanded="!collapsedGroups[group.key]"
                            @click="collapsedGroups[group.key] = !collapsedGroups[group.key]">
                            {{ group.label }}
                            <span :class="['caret', { collapsed: collapsedGroups[group.key] }]"
                                aria-hidden="true">▾</span>
                        </button>
                        <div v-show="!collapsedGroups[group.key]" class="group-links">
                            <RouterLink v-for="link in group.links" :key="link.routeName" :to="link.to"
                                :class="['nav-link', { active: isActive(link) }]"
                                :aria-current="isActive(link) ? 'page' : undefined">
                                <span class="nav-dot" aria-hidden="true"></span>{{ link.label }}
                            </RouterLink>
                        </div>
                    </template>
                </nav>
            </aside>

            <div class="cc-content">
                <RouterView />
            </div>
        </main>
    </div>
</template>

<style lang="scss" scoped>
@use '@/pages/creativeCenter/shared/styles/cc' as *;

.creative-center-page {
    min-height: 100vh;
    background: $warm-accent;
    color: #FFFFFF;
}

.cc-main {
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr);
    gap: 36px;
    align-items: start;
    margin: 0 auto;
    padding: 28px 48px 88px;
}

/*——————左侧栏—————— */

.cc-aside {
    position: sticky;
    top: $warm-header-height + 24px;
    display: flex;
    flex-direction: column;
    gap: 22px;
}

.aside-title {
    display: flex;
    flex-direction: column;
    gap: 6px;

    .title {
        font-size: 24px;
        font-weight: 800;
        letter-spacing: -0.01em;
    }

    .title-tag {
        font-family: $warm-font-mono;
        font-size: 10px;
        letter-spacing: 0.18em;
        color: $warm-accent-on-dark-2;
    }
}

.upload-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 52px;
    border-radius: 999px;
    background: #FFFFFF;
    color: $warm-accent;
    font-size: 15px;
    font-weight: 700;
    text-decoration: none;
    transition: background-color 0.2s, box-shadow 0.2s;

    &:hover {
        background: $warm-accent-soft;
    }

    // 正在投稿页：外面一圈半透明白光
    &.active {
        box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.28);
    }

    &:focus-visible {
        outline: 2px solid #FFFFFF;
        outline-offset: 3px;
    }

    .upload-plus {
        font-size: 20px;
        font-weight: 400;
        line-height: 1;
    }
}

.cc-nav {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.group-links {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.nav-link {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 46px;
    padding: 0 16px;
    border-radius: 16px;
    color: $warm-accent-on-dark-2;
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
    transition: background-color 0.2s, color 0.2s;

    .nav-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: transparent;
    }

    &:hover {
        background: rgba(255, 255, 255, 0.1);
    }

    &.active {
        background: rgba(255, 255, 255, 0.16);
        color: #FFFFFF;
        font-weight: 700;

        .nav-dot {
            background: #FFFFFF;
        }
    }

    &:focus-visible {
        outline: 2px solid #FFFFFF;
        outline-offset: -2px;
    }
}

.group-toggle {
    @include reset-button;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 40px;
    margin-top: 14px;
    padding: 0 16px;
    font-family: $warm-font-mono;
    font-size: 12px;
    letter-spacing: 0.14em;
    color: $warm-accent-on-dark-2;

    .caret {
        font-size: 12px;
        transition: transform 0.2s;

        &.collapsed {
            transform: rotate(-90deg);
        }
    }

    &:focus-visible {
        outline-color: #FFFFFF;
    }
}

/*——————右侧内容：每个子页面根节点是 .cc-page，标题行和各个面板之间 20px—————— */

.cc-content {
    min-width: 0;

    :deep(.cc-page) {
        display: flex;
        flex-direction: column;
        gap: 20px;
        min-width: 0;
    }
}
</style>

<style lang="scss">
// 页面比窗口短时，给滚动条预留的那一条露的是根节点背景，创作中心里也染成蓝色
html.creative-center-open {
    background: $warm-accent;
}
</style>
