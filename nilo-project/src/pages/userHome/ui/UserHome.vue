<script lang="ts" setup>
import { computed, inject } from 'vue';
import { useHostUserDetailStore } from '@/shared/store/HostUserDetailStore.ts';
import { imgRequestUrl } from '@/shared/utils/ImgUtil';
import { formatCount } from '@/shared/utils/NumberUtil';
import SiteHeader from '@/shared/widgets/siteHeader/ui/SiteHeader.vue';
import { useUserHome } from '../composables/useUserHome';
import defaultAvatar from '@/assets/user.svg';
import UserInfoEditor from '../features/userInfoEditor/ui/UserInfoEditor.vue';
import UserHomeBgImg from '../features/userHomeBgImg/ui/UserHomeBgImg.vue';
import NotFound from '@/shared/entities/notFound/ui/NotFound.vue';
import Cover from '@/shared/ui/Cover.vue';
import message from '@/shared/lib/message.ts';

// 获取内容部分最大最小宽度
const mainContentMaxWidth: number = inject('mainContentMaxWidth', 0)
const mainContentMinWidth: number = inject('mainContentMinWidth', 0)

const AVATAR_SIZE = 108

const hostUserDetailStore = useHostUserDetailStore();
const {
    hideUi,
    isMySelf,
    hostUserId,
    wallpaperIndex,
    wallpaperUrl,
    wallpaperDark,
    navItems,
    activeRouteName,
    keyword,
    showEditor,
    showBgImgEditor,
    currentThemeIndex,
    loading,
    notFound,
    followPending,
    setPreviewWallpaper,
    searchVideos,
    toggleFollow,
    navigateTo,
    viewFollowing,
    viewFollower,
    reloadUserInfo,
} = useUserHome();

const detail = computed(() => hostUserDetailStore.userHostDetail)

/** 0 女 1 男 2 未知 */
const genderMark = computed(() =>
{
    switch (detail.value?.gender)
    {
        case 0: return { text: '♀', label: '女' }
        case 1: return { text: '♂', label: '男' }
        default: return { text: '?', label: '性别未知' }
    }
})

/** 关注、粉丝只有本人能点开列表（接口只能查自己的） */
const stats = computed(() => [
    { label: '关注', value: detail.value?.followingCount, onClick: isMySelf.value ? viewFollowing : null },
    { label: '粉丝', value: detail.value?.followerCount, onClick: isMySelf.value ? viewFollower : null },
    { label: '获赞', value: detail.value?.likeCount, onClick: null },
    { label: '播放', value: detail.value?.playCount, onClick: null },
])

const profileRows = computed(() => [
    { key: 'UID', value: detail.value?.userId || '-', mono: true },
    // 只显示月-日
    { key: '生日', value: detail.value?.birthday ? detail.value.birthday.slice(5) : '未填写', mono: false },
    { key: '学校', value: detail.value?.school || '未填写', mono: false },
])

/** 系列详情仍然算「系列」标签 */
function isTabActive(routeName: string)
{
    return activeRouteName.value === routeName
}

function tabCount(kind: 'upload' | 'series' | 'collection' | null)
{
    if (!kind) return ''
    const count = hostUserDetailStore.counts[kind]
    return count === null ? '' : formatCount(count)
}

const wallpaperLabel = computed(() => `WALLPAPER · ${String(wallpaperIndex.value).padStart(2, '0')}`)

function saveTheme(index: number)
{
    // 更改store
    hostUserDetailStore.setTheme(index)
    // 删除预览数据
    setPreviewWallpaper(null)
    // 关闭选择壁纸界面
    showBgImgEditor.value = false
    // 提示消息
    message.success('壁纸修改成功')
}
</script>

<template>
    <div :class="['user-home-page', 'warm-theme', { 'dark-wallpaper': wallpaperDark }]">
        <!-- 壁纸固定铺满整个页面，内容在上面滚动 -->
        <div class="wallpaper" :style="wallpaperUrl ? { backgroundImage: `url(${wallpaperUrl})` } : {}"
            aria-hidden="true"></div>
        <span class="wallpaper-label" aria-hidden="true">{{ wallpaperLabel }}</span>

        <SiteHeader glass />

        <main :class="['user-home-main', { hidden: hideUi }]" :style="{
            'max-width': mainContentMaxWidth + 'px',
            'min-width': mainContentMinWidth + 'px',
        }" :aria-hidden="hideUi || undefined" :inert="hideUi || undefined">
            <div class="hero-gap"></div>

            <div v-if="notFound" class="not-found-card">
                <NotFound title="用户不存在" hint="该用户可能不存在或链接有误" />
            </div>

            <template v-else>
                <!-- 主页信息：头像、昵称、简介、数据、操作 -->
                <section class="hero">
                    <span class="hero-avatar">
                        <Cover v-if="detail?.avatar" :src="imgRequestUrl(detail.avatar)" :width="AVATAR_SIZE"
                            :preview="true" :thumbnail="true" fit="cover" border-radius="50%" :lazy="false" />
                        <img v-else-if="!loading" :src="defaultAvatar" alt="">
                    </span>

                    <div v-if="detail" class="hero-text">
                        <div class="name-row">
                            <h1 class="name">{{ detail.nickName }}</h1>
                            <span class="gender" :title="genderMark.label" :aria-label="genderMark.label">
                                {{ genderMark.text }}
                            </span>
                            <span v-if="isMySelf" class="owner-tag">这是你的主页</span>
                        </div>
                        <p class="bio">{{ detail.personalIntroduction || '这个人很神秘，什么都没有写' }}</p>
                    </div>
                    <div v-else class="hero-text" aria-hidden="true">
                        <span class="skeleton-block skeleton-name"></span>
                        <span class="skeleton-block skeleton-bio"></span>
                    </div>

                    <div class="hero-spacer"></div>

                    <div class="stats">
                        <component :is="stat.onClick ? 'button' : 'div'" v-for="stat in stats" :key="stat.label"
                            :type="stat.onClick ? 'button' : undefined"
                            :class="['stat', { clickable: stat.onClick }]" @click="stat.onClick?.()">
                            <span class="stat-value">{{ stat.value == null ? '-' : formatCount(stat.value) }}</span>
                            <span class="stat-label">{{ stat.label }}</span>
                        </component>
                    </div>

                    <div class="hero-actions">
                        <button type="button" class="round-button" title="只看壁纸" aria-label="只看壁纸"
                            @click="hideUi = true">
                            <span class="picture-icon" aria-hidden="true"></span>
                        </button>
                        <template v-if="detail && isMySelf">
                            <button type="button" class="round-button" title="更换壁纸" aria-label="更换壁纸"
                                @click="showBgImgEditor = true">
                                <span class="palette-icon" aria-hidden="true"><i></i><i></i><i></i></span>
                            </button>
                            <button type="button" class="edit-button" @click="showEditor = true">编辑资料</button>
                        </template>
                        <button v-else-if="detail" type="button"
                            :class="['follow-button', { followed: detail.hasFollowed }]" :disabled="followPending"
                            @click="toggleFollow">
                            {{ detail.hasFollowed ? '已关注' : '+ 关注' }}
                        </button>
                    </div>
                </section>

                <!-- 标签 + 搜索 TA 的视频 -->
                <div class="toolbar">
                    <nav class="tabs" aria-label="主页内容">
                        <button v-for="item in navItems" :key="item.routeName" type="button"
                            :class="['tab', { active: isTabActive(item.routeName) }]"
                            :aria-current="isTabActive(item.routeName) ? 'page' : undefined" @click="navigateTo(item)">
                            {{ item.label }}
                            <span v-if="tabCount(item.countKind)" class="tab-count">{{ tabCount(item.countKind) }}</span>
                        </button>
                    </nav>
                    <label class="video-search">
                        <span class="search-icon" aria-hidden="true"></span>
                        <input v-model="keyword" type="search" maxlength="100" placeholder="搜索 TA 的视频"
                            aria-label="搜索 TA 的视频" @keyup.enter="searchVideos">
                    </label>
                </div>

                <div class="layout">
                    <div class="content-column">
                        <RouterView :key="hostUserId" />
                    </div>

                    <aside class="side-column">
                        <div class="notice-card">
                            <span class="notice-label">公告</span>
                            <p>{{ detail?.noticeInfo || '暂无公告' }}</p>
                        </div>
                        <div class="profile-card">
                            <span class="profile-title">个人资料</span>
                            <div v-for="row in profileRows" :key="row.key" class="profile-row">
                                <span class="profile-key">{{ row.key }}</span>
                                <span :class="['profile-value', { mono: row.mono }]" :title="row.value">
                                    {{ row.value }}
                                </span>
                            </div>
                        </div>
                    </aside>
                </div>
            </template>
        </main>

        <!-- 只看壁纸时右下角的按钮 -->
        <Transition name="float-actions">
            <div v-if="hideUi" class="float-actions">
                <button v-if="detail && isMySelf" type="button" class="float-wallpaper-button"
                    @click="showBgImgEditor = true">
                    更换壁纸
                </button>
                <button type="button" class="float-back-button" @click="hideUi = false">
                    <span class="back-mark" aria-hidden="true"></span>返回主页
                </button>
            </div>
        </Transition>

        <template v-if="detail && isMySelf">
            <UserInfoEditor v-model:visible="showEditor" @reload="reloadUserInfo" />
            <UserHomeBgImg v-model:show="showBgImgEditor" :current-theme-index="currentThemeIndex"
                @preview="setPreviewWallpaper" @save-theme="saveTheme" />
        </template>
    </div>
</template>

<style lang="scss" scoped>
@use '@/pages/userHome/shared/styles/glass' as *;

.user-home-page {
    position: relative;
    min-height: 100vh;
    // 暗壁纸上换成磨砂档
    --glass-tint: rgba(255, 255, 255, 0.3);

    &.dark-wallpaper {
        --glass-tint: rgba(255, 255, 255, 0.62);
    }

    button {
        @include reset-button;
    }
}

.wallpaper {
    position: fixed;
    inset: 0;
    z-index: 0;
    background-color: #E9ECF3;
    background-position: center;
    background-size: cover;
    transition: background-image 0.3s ease;
}

.wallpaper-label {
    position: fixed;
    left: 40px;
    bottom: 28px;
    z-index: 1;
    font-family: $warm-font-mono;
    font-size: 11px;
    letter-spacing: 0.14em;
    color: rgba(11, 12, 18, 0.5);
    pointer-events: none;

    .dark-wallpaper & {
        color: rgba(255, 255, 255, 0.6);
    }
}

.user-home-main {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
    margin: 0 auto;
    padding: 0 48px 64px;
    transition: opacity 0.45s ease, transform 0.45s ease;

    // 只看壁纸：内容淡出下沉
    &.hidden {
        opacity: 0;
        transform: translateY(24px) scale(0.99);
        pointer-events: none;
    }
}

// 顶栏和主页信息之间留一段，露出壁纸
.hero-gap {
    height: 240px;
}

.not-found-card {
    align-self: center;
    width: 460px;
    padding: 20px 20px 30px;
    border-radius: 36px;
    @include glass-panel;
}

/*——————主页信息—————— */

.hero {
    display: flex;
    align-items: center;
    gap: 26px;
    padding: 28px 28px 28px 32px;
    border-radius: 36px;
    @include glass-panel;
}

.hero-avatar {
    flex-shrink: 0;
    width: 108px;
    height: 108px;
    border-radius: 50%;
    overflow: hidden;
    background: linear-gradient(140deg, oklch(0.9 0.03 255), oklch(0.62 0.12 258));
    box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.75), 0 16px 30px -12px rgba(11, 12, 18, 0.35);

    img,
    :deep(.el-image) {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
}

.hero-text {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
}

.name-row {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
}

.name {
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 40px;
    font-weight: 800;
    letter-spacing: -0.025em;
    line-height: 1.05;
}

.gender {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.7);
    color: $warm-accent;
    font-size: 13px;
    font-weight: 700;
}

.owner-tag {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    height: 26px;
    padding: 0 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.7);
    color: $warm-ink-3;
    font-size: 11px;
    font-weight: 600;
}

.bio {
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 15px;
    color: $warm-ink-2;
}

.hero-spacer {
    flex: 1;
}

.stats {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
    padding: 6px;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.4);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.5);
}

// 关注/粉丝在本人视角是按钮，要压过上面按钮的通用重置
.user-home-page .stat {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 92px;
    padding: 12px 16px;
    border-radius: 18px;
    text-align: left;
    transition: background-color 0.2s;

    &.clickable:hover {
        background: rgba(255, 255, 255, 0.6);
    }

    .stat-value {
        font-size: 24px;
        font-weight: 700;
        letter-spacing: -0.01em;
        line-height: 1.1;
    }

    .stat-label {
        font-size: 12px;
        color: $warm-ink-3;
    }
}

.hero-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}

.user-home-page .round-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.55);
    box-shadow: $glass-chip-edge;
    transition: background-color 0.2s;

    &:hover {
        background: rgba(255, 255, 255, 0.85);
    }
}

// 只看壁纸：一幅小画，左下角蓝点
.picture-icon {
    position: relative;
    width: 18px;
    height: 14px;
    border: 1.5px solid $warm-ink;
    border-radius: 4px;

    &::after {
        content: '';
        position: absolute;
        left: 3px;
        bottom: 2px;
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: $warm-accent;
    }
}

// 更换壁纸：三个色点
.palette-icon {
    display: flex;
    gap: 2px;

    i {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: oklch(0.7 0.15 30);

        &:nth-child(2) {
            background: oklch(0.7 0.15 150);
        }

        &:nth-child(3) {
            background: $warm-accent;
        }
    }
}

.user-home-page .edit-button {
    display: flex;
    align-items: center;
    height: 50px;
    padding: 0 24px;
    border-radius: 999px;
    background: $warm-ink;
    color: #FFFFFF;
    font-size: 14px;
    font-weight: 600;
    transition: background-color 0.2s;

    &:hover {
        background: $warm-accent;
    }
}

.user-home-page .follow-button {
    display: flex;
    align-items: center;
    height: 50px;
    padding: 0 26px;
    border-radius: 999px;
    background: $warm-accent;
    color: #FFFFFF;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 14px 30px -14px rgba(0, 0, 242, 0.7);
    font-size: 14px;
    font-weight: 600;
    transition: background-color 0.2s, color 0.2s;

    &.followed {
        background: rgba(255, 255, 255, 0.6);
        color: $warm-ink-3;
        box-shadow: $glass-chip-edge;

        &:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.85);
        }
    }

    &:disabled {
        opacity: 0.7;
    }
}

/*——————标签 + 搜索—————— */

.toolbar {
    display: flex;
    align-items: center;
    gap: 24px;
}

.tabs {
    display: flex;
    gap: 4px;
    padding: 6px;
    border-radius: 999px;
    @include glass-panel(28px, 0 16px 40px -24px rgba(11, 12, 18, 0.35));
}

.user-home-page .tab {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 42px;
    padding: 0 20px;
    border-radius: 999px;
    color: $warm-ink-2;
    font-size: 14px;
    font-weight: 500;
    transition: background-color 0.2s, color 0.2s;

    &:hover {
        color: $warm-accent;
    }

    .tab-count {
        font-size: 12px;
        font-weight: 500;
        color: $warm-ink-3;
    }

    &.active {
        background: #FFFFFF;
        color: $warm-accent;
        font-weight: 700;
        box-shadow: 0 6px 16px -8px rgba(11, 12, 18, 0.3);

        .tab-count {
            color: $warm-accent;
        }
    }
}

.video-search {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 300px;
    height: 54px;
    padding: 0 20px;
    border-radius: 999px;
    cursor: text;
    @include glass-panel(28px, 0 16px 40px -24px rgba(11, 12, 18, 0.35));
    transition: box-shadow 0.2s;

    &:focus-within {
        box-shadow: $glass-edge, inset 0 0 0 1.5px $warm-accent, 0 16px 40px -24px rgba(11, 12, 18, 0.35);
    }

    input {
        flex: 1;
        min-width: 0;
        height: 100%;
        padding: 0;
        border: none;
        outline: none;
        background: transparent;
        color: $warm-ink;
        font-size: 13px;

        &::placeholder {
            color: $warm-ink-3;
        }

        &::-webkit-search-cancel-button {
            cursor: pointer;
        }
    }
}

// 放大镜：圆环 + 斜柄
.search-icon {
    position: relative;
    flex-shrink: 0;
    width: 13px;
    height: 13px;

    &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        width: 9px;
        height: 9px;
        box-sizing: border-box;
        border: 1.5px solid $warm-ink-3;
        border-radius: 50%;
    }

    &::after {
        content: '';
        position: absolute;
        left: 8px;
        top: 9px;
        width: 5px;
        height: 1.5px;
        background: $warm-ink-3;
        transform: rotate(45deg);
    }
}

/*——————内容 + 侧栏—————— */

.layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: 20px;
    align-items: start;
}

.content-column {
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-width: 0;
}

// 滚动时侧栏停在顶栏下面
.side-column {
    position: sticky;
    top: 104px;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.notice-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 24px 26px;
    border-radius: 32px;
    background: rgba(0, 0, 242, 0.82);
    color: #FFFFFF;
    backdrop-filter: blur(28px) saturate(1.6);
    -webkit-backdrop-filter: blur(28px) saturate(1.6);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45), inset 0 0 0 1px rgba(255, 255, 255, 0.2), 0 30px 60px -30px rgba(0, 0, 242, 0.6);

    .notice-label {
        font-family: $warm-font-mono;
        font-size: 11px;
        letter-spacing: 0.16em;
        color: $warm-accent-on-dark-2;
    }

    p {
        margin: 0;
        font-size: 15px;
        line-height: 1.8;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        text-wrap: pretty;
    }
}

.profile-card {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 24px 26px 18px;
    border-radius: 32px;
    @include glass-panel;

    .profile-title {
        margin-bottom: 8px;
        font-size: 15px;
        font-weight: 700;
    }
}

.profile-row {
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr);
    gap: 12px;
    padding: 10px 0;
    border-top: 1px solid rgba(255, 255, 255, 0.6);
    font-size: 13px;

    .profile-key {
        color: $warm-ink-3;
    }

    .profile-value {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: $warm-ink;

        &.mono {
            font-family: $warm-font-mono;
        }
    }
}

/*——————只看壁纸时的按钮—————— */

.float-actions {
    position: fixed;
    right: 40px;
    bottom: 32px;
    z-index: 30;
    display: flex;
    gap: 10px;
}

.user-home-page .float-wallpaper-button {
    display: flex;
    align-items: center;
    height: 52px;
    padding: 0 24px;
    border-radius: 999px;
    font-size: 14px;
    font-weight: 600;
    background: rgba(255, 255, 255, 0.45);
    backdrop-filter: blur(28px) saturate(1.8);
    -webkit-backdrop-filter: blur(28px) saturate(1.8);
    box-shadow: $glass-edge, 0 20px 50px -24px rgba(11, 12, 18, 0.4);
    transition: background-color 0.2s;

    &:hover {
        background: rgba(255, 255, 255, 0.7);
    }
}

.user-home-page .float-back-button {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 52px;
    padding: 0 24px 0 8px;
    border-radius: 999px;
    background: rgba(0, 0, 242, 0.85);
    color: #FFFFFF;
    font-size: 14px;
    font-weight: 600;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45), 0 20px 50px -20px rgba(0, 0, 242, 0.6);

    // 白圆里一个蓝点
    .back-mark {
        position: relative;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #FFFFFF;

        &::after {
            content: '';
            position: absolute;
            left: 13px;
            top: 13px;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: $warm-accent;
        }
    }
}

.float-actions-enter-active,
.float-actions-leave-active {
    transition: opacity 0.3s ease, transform 0.3s ease;
}

.float-actions-enter-from,
.float-actions-leave-to {
    opacity: 0;
    transform: translateY(12px);
}

/*——————资料加载中—————— */

.skeleton-block {
    display: block;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.5);
}

.skeleton-name {
    width: 220px;
    height: 40px;
}

.skeleton-bio {
    width: 320px;
    height: 16px;
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
