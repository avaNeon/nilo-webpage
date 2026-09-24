<script setup lang="ts">
import type { VideoInfo } from '@/shared/model/VideoInfo';
import useCategoryStore from '@/shared/store/CategoryStore';
import { CAROUSEL_VIDEO_COUNT } from '@/shared/config/Config';
import { formatCount } from '@/shared/utils/NumberUtil';
import { formatDurationClock, formatRelativeDay } from '@/shared/utils/DateUtil';
import { imgRequestUrl } from '@/shared/utils/ImgUtil';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';

/** 自动轮播间隔（ms），也是进度条动画时长 */
const AUTOPLAY_INTERVAL = 6000

const props = defineProps<{
    /** 轮播视频（推荐接口的前几个） */
    slides: VideoInfo[],
    loading: boolean,
}>()

const categoryStore = useCategoryStore()

interface SlideView {
    key: string | number
    videoPath: string
    title: string
    /** 视频简介，没有就不显示 */
    description: string
    cover: string | null
    creatorPath: string | null
    creatorName: string
    /** 头像旁边的小字：UP 主 · N 天前更新 */
    creatorSubText: string
    avatar: string | null
    categoryText: string
    playCountText: string
    durationText: string
}

/** 分类名：有父子分类时显示「父 · 子」 */
function getCategoryLabel(videoInfo: VideoInfo): string
{
    const categoryMap = categoryStore.categoryMap
    const category = videoInfo.categoryNumber ? categoryMap[videoInfo.categoryNumber] : undefined
    let parent = videoInfo.pCategoryNumber ? categoryMap[videoInfo.pCategoryNumber] : undefined
    if (!parent && category)
    {
        parent = categoryStore.getParentCategory(category)
    }
    const names: string[] = []
    if (parent)
    {
        names.push(parent.categoryName)
    }
    if (category && category !== parent)
    {
        names.push(category.categoryName)
    }
    return names.join(' · ')
}

const slideViews = computed((): SlideView[] => props.slides.map((videoInfo, index) =>
{
    const creator = videoInfo.briefUserInfo ?? videoInfo.userInfo ?? null
    const relativeDay = formatRelativeDay(videoInfo.lastUpdateTime ?? videoInfo.createTime)
    return {
        key: videoInfo.videoId ?? index,
        videoPath: `/video/${videoInfo.videoId ?? ''}`,
        title: (videoInfo.videoName ?? '').replace(/<[^>]*>/g, ''),
        // 简介里的换行（含转义的 \n）压成一行，交给 CSS 截断
        description: (videoInfo.introduction ?? '').replace(/\\n|\s+/g, ' ').trim(),
        cover: videoInfo.videoCover,
        creatorPath: creator?.userId ? `/user/${creator.userId}` : null,
        creatorName: creator?.nickName || '未知UP主',
        creatorSubText: relativeDay ? `UP 主 · ${relativeDay}更新` : 'UP 主',
        avatar: creator?.avatar ?? null,
        categoryText: getCategoryLabel(videoInfo),
        playCountText: formatCount(videoInfo.playCount),
        durationText: formatDurationClock(videoInfo.duration),
    }
}))

/*——————轮播状态—————— */

const activeIndex = ref(0)
// 上一张封面在新封面淡入期间垫在下面，避免交叉淡入时透出底色
const prevIndex = ref<number | null>(null)
// 每次切换都自增，作为进度条的 key，保证重新计时
const progressCycle = ref(0)
const pageHidden = ref(false)

const activeView = computed(() => slideViews.value[activeIndex.value] ?? slideViews.value[0] ?? null)

function goTo(index: number)
{
    if (index !== activeIndex.value)
    {
        prevIndex.value = activeIndex.value
        activeIndex.value = index
    }
    progressCycle.value++
}

// 进度条走完再切下一张，进度与切换始终同步；悬停和标签页隐藏时进度条暂停
function onProgressEnd()
{
    const count = slideViews.value.length
    if (count > 1)
    {
        goTo((activeIndex.value + 1) % count)
    }
}

function onVisibilityChange()
{
    pageHidden.value = document.hidden
}

onMounted(() =>
{
    pageHidden.value = document.hidden
    document.addEventListener('visibilitychange', onVisibilityChange)
})

onBeforeUnmount(() =>
{
    document.removeEventListener('visibilitychange', onVisibilityChange)
})

/** 编号 01、02… */
function slideNumber(index: number): string
{
    return (index + 1).toString().padStart(2, '0')
}

/*——————图片加载状态：封面加载完才显示，失败时露出占位底色—————— */

const coverState = ref<Record<number, 'loaded' | 'failed'>>({})
const avatarFailed = ref<Record<number, boolean>>({})

watch(() => props.slides, () =>
{
    activeIndex.value = 0
    prevIndex.value = null
    progressCycle.value++
    coverState.value = {}
    avatarFailed.value = {}
})

function coverClass(index: number)
{
    const loaded = coverState.value[index] === 'loaded'
    const activeFailed = coverState.value[activeIndex.value] === 'failed'
    return {
        'is-active': loaded && index === activeIndex.value,
        'is-prev': loaded && !activeFailed && index === prevIndex.value && index !== activeIndex.value,
    }
}

function onCoverLoad(index: number)
{
    coverState.value[index] = 'loaded'
}

function onCoverError(index: number)
{
    coverState.value[index] = 'failed'
}

const activeAvatarSrc = computed(() =>
{
    if (!activeView.value?.avatar || avatarFailed.value[activeIndex.value])
    {
        return ''
    }
    return imgRequestUrl(activeView.value.avatar, true)
})

function onAvatarError()
{
    avatarFailed.value[activeIndex.value] = true
}
</script>

<template>
    <!-- 加载中：与正式内容同尺寸的占位 -->
    <section v-if="loading" class="home-hero is-skeleton" aria-busy="true" aria-label="精选推荐">
        <div class="hero-card">
            <div class="hero-info">
                <span class="sk sk-eyebrow"></span>
                <div class="hero-text">
                    <span class="sk-title-group">
                        <span class="sk sk-title"></span>
                        <span class="sk sk-title short"></span>
                    </span>
                    <span class="sk sk-desc"></span>
                    <span class="sk-creator">
                        <span class="sk sk-avatar"></span>
                        <span class="sk sk-name"></span>
                    </span>
                </div>
                <div class="hero-actions">
                    <span class="sk sk-button"></span>
                    <span class="sk sk-button secondary"></span>
                </div>
            </div>
            <div class="hero-media sk"></div>
        </div>
        <div class="hero-strip" :style="{ gridTemplateColumns: `repeat(${CAROUSEL_VIDEO_COUNT}, minmax(0, 1fr))` }">
            <div v-for="index in CAROUSEL_VIDEO_COUNT" :key="index" class="strip-item">
                <span class="strip-track"></span>
                <span class="strip-text">
                    <span class="sk-line sk-strip-title"></span>
                    <span class="sk-line sk-strip-creator"></span>
                </span>
            </div>
        </div>
    </section>

    <section v-else-if="activeView" :class="['home-hero', { 'is-paused': pageHidden }]"
        aria-roledescription="carousel" aria-label="精选推荐">
        <div class="hero-card">
            <div class="hero-info">
                <div class="hero-eyebrow">
                    <span class="hero-eyebrow-label"><span class="hero-eyebrow-dot"></span>精选推荐</span>
                    <span class="hero-eyebrow-en">EDITOR'S PICK</span>
                </div>
                <Transition name="hero-swap" mode="out-in">
                    <div :key="activeIndex" class="hero-text">
                        <h1 class="hero-title">
                            <RouterLink :to="activeView.videoPath" target="_blank" :title="activeView.title">
                                {{ activeView.title }}
                            </RouterLink>
                        </h1>
                        <p v-if="activeView.description" class="hero-desc">{{ activeView.description }}</p>
                        <component :is="activeView.creatorPath ? RouterLink : 'span'" class="hero-creator"
                            v-bind="activeView.creatorPath ? { to: activeView.creatorPath, target: '_blank' } : {}">
                            <span class="creator-avatar">
                                <img v-if="activeAvatarSrc" :src="activeAvatarSrc" alt="" @error="onAvatarError">
                            </span>
                            <span class="creator-text">
                                <span class="creator-name">{{ activeView.creatorName }}</span>
                                <span class="creator-sub">{{ activeView.creatorSubText }}</span>
                            </span>
                        </component>
                    </div>
                </Transition>
                <div class="hero-bottom">
                    <div class="hero-actions">
                        <RouterLink class="hero-button primary" :to="activeView.videoPath" target="_blank">
                            <span class="play-circle"><span class="play-icon"></span></span>立即观看
                        </RouterLink>
                        <RouterLink v-if="activeView.creatorPath" class="hero-button secondary"
                            :to="activeView.creatorPath" target="_blank">UP 主主页</RouterLink>
                    </div>
                    <span class="hero-stats">
                        <span><span class="hero-stat-value">{{ activeView.playCountText }}</span> 观看</span>
                        <span class="hero-stat-value">{{ activeView.durationText }}</span>
                    </span>
                </div>
            </div>

            <div class="hero-media">
                <!-- 所有封面叠放预加载，切换时交叉淡入 -->
                <RouterLink class="hero-cover-link" :to="activeView.videoPath" target="_blank" tabindex="-1"
                    :aria-label="activeView.title">
                    <template v-for="(view, index) in slideViews" :key="view.key">
                        <img v-if="view.cover && coverState[index] !== 'failed'"
                            :class="['hero-cover', coverClass(index)]" :src="imgRequestUrl(view.cover)" alt=""
                            @load="onCoverLoad(index)" @error="onCoverError(index)">
                    </template>
                </RouterLink>
                <span v-if="activeView.categoryText" class="hero-chip">
                    <span class="hero-chip-dot"></span>{{ activeView.categoryText }}
                </span>
            </div>
        </div>

        <!-- 下方编号条：当前一条的进度条走完自动切到下一条 -->
        <div v-if="slideViews.length > 1" class="hero-strip"
            :style="{ gridTemplateColumns: `repeat(${slideViews.length}, minmax(0, 1fr))` }">
            <button v-for="(view, index) in slideViews" :key="view.key" type="button"
                :class="['strip-item', { active: index === activeIndex }]"
                :aria-current="index === activeIndex ? 'true' : undefined" @click="goTo(index)">
                <span class="strip-track">
                    <span v-if="index === activeIndex" :key="`progress-${progressCycle}`" class="strip-progress"
                        :style="{ animationDuration: `${AUTOPLAY_INTERVAL}ms` }" @animationend="onProgressEnd"></span>
                </span>
                <span class="strip-row">
                    <span class="strip-num">{{ slideNumber(index) }}</span>
                    <span class="strip-text">
                        <span class="strip-title">{{ view.title }}</span>
                        <span class="strip-creator">{{ view.creatorName }}</span>
                    </span>
                </span>
            </button>
        </div>
    </section>
</template>

<style lang="scss" scoped>
@keyframes hero-progress {
    from {
        transform: scaleX(0);
    }

    to {
        transform: scaleX(1);
    }
}

@keyframes hero-skeleton-pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.55;
    }
}

// 单行省略
@mixin ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

// 多行截断
@mixin clamp($lines) {
    display: -webkit-box;
    -webkit-line-clamp: $lines;
    -webkit-box-orient: vertical;
    overflow: hidden;
    overflow-wrap: anywhere;
}

.home-hero {
    display: flex;
    flex-direction: column;

    button {
        padding: 0;
        border: none;
        background: transparent;
        font: inherit;
        color: inherit;
        cursor: pointer;
    }
}

// 蓝色色块：左文字、右封面
.hero-card {
    display: grid;
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    height: 540px;
    padding: 14px;
    border-radius: 32px;
    background: $warm-accent;
    color: #FFFFFF;
}

/*——————左侧信息—————— */

.hero-info {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 20px;
    min-width: 0;
    padding: 30px 36px 26px 30px;
}

.hero-eyebrow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    font-family: $warm-font-mono;
    font-size: 12px;
    letter-spacing: 0.16em;
}

.hero-eyebrow-label {
    display: flex;
    align-items: center;
    gap: 8px;
}

.hero-eyebrow-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #FFFFFF;
}

.hero-eyebrow-en {
    color: $warm-accent-on-dark;
}

.hero-text {
    display: flex;
    flex-direction: column;
    gap: 22px;
    min-width: 0;
}

.hero-title {
    @include clamp(3);
    margin: 0;
    font-size: 54px;
    font-weight: 800;
    line-height: 1.16;
    letter-spacing: -0.025em;
    text-wrap: pretty;

    a {
        color: #FFFFFF;
        transition: opacity 0.2s;

        &:hover {
            opacity: 0.85;
        }
    }
}

.hero-desc {
    @include clamp(2);
    max-width: 420px;
    margin: 0;
    font-size: 16px;
    line-height: 1.8;
    color: $warm-accent-on-dark-2;
    text-wrap: pretty;
}

.hero-creator {
    display: flex;
    align-items: center;
    gap: 12px;
    align-self: flex-start;
    min-width: 0;
    color: #FFFFFF;

    &:is(a):hover .creator-name {
        text-decoration: underline;
        text-underline-offset: 3px;
    }
}

// 头像外圈：先一圈蓝色再一圈白色
.creator-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    flex-shrink: 0;
    overflow: hidden;
    background: linear-gradient(140deg, oklch(0.92 0.01 265), oklch(0.8 0.02 265));
    box-shadow: 0 0 0 2px $warm-accent, 0 0 0 3px #FFFFFF;

    img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
}

.creator-text {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
}

.creator-name {
    @include ellipsis;
    max-width: 240px;
    font-size: 14px;
    font-weight: 600;
}

.creator-sub {
    font-size: 12px;
    color: $warm-accent-on-dark;
}

.hero-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
}

.hero-actions {
    display: flex;
    gap: 10px;
}

.hero-button {
    display: inline-flex;
    align-items: center;
    height: 52px;
    border-radius: 999px;
    font-size: 15px;
    white-space: nowrap;
    transition: background 0.2s, transform 0.2s;

    &:focus-visible {
        outline: 2px solid #FFFFFF;
        outline-offset: 2px;
    }

    // 白底胶囊，左侧蓝色圆形播放键
    &.primary {
        gap: 12px;
        padding: 0 26px 0 8px;
        background: #FFFFFF;
        color: $warm-accent;
        font-weight: 600;

        &:hover {
            transform: translateY(-1px);
        }
    }

    &.secondary {
        padding: 0 22px;
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.45);
        color: #FFFFFF;
        font-weight: 500;

        &:hover {
            background: rgba(255, 255, 255, 0.1);
        }
    }
}

.play-circle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding-left: 3px;
    border-radius: 50%;
    background: $warm-accent;
}

.play-icon {
    width: 0;
    height: 0;
    border-left: 10px solid #FFFFFF;
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
}

.hero-stats {
    display: flex;
    align-items: baseline;
    gap: 18px;
    flex-shrink: 0;
    font-size: 12px;
    color: $warm-accent-on-dark;
    white-space: nowrap;
}

.hero-stat-value {
    font-size: 15px;
    font-weight: 600;
    color: #FFFFFF;
}

// 切换时左侧文字短暂淡出淡入
.hero-swap-enter-active {
    transition: opacity 0.28s ease, transform 0.28s ease;
}

.hero-swap-leave-active {
    transition: opacity 0.16s ease, transform 0.16s ease;
}

.hero-swap-enter-from {
    opacity: 0;
    transform: translateY(6px);
}

.hero-swap-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}

/*——————右侧封面—————— */

.hero-media {
    position: relative;
    min-width: 0;
    border-radius: 22px;
    overflow: hidden;
    isolation: isolate;
    background: linear-gradient(150deg, oklch(0.94 0.008 265), oklch(0.83 0.016 265));
}

.hero-cover-link {
    position: absolute;
    inset: 0;
    z-index: 0;
    display: block;
}

.hero-cover {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0;

    &.is-prev {
        z-index: 1;
        opacity: 1;
    }

    &.is-active {
        z-index: 2;
        opacity: 1;
        transition: opacity 0.6s ease;
    }
}

// 左下角毛玻璃标签：分类
.hero-chip {
    position: absolute;
    left: 18px;
    bottom: 18px;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    max-width: calc(100% - 36px);
    height: 34px;
    padding: 0 14px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.82);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    font-size: 12px;
    font-weight: 500;
    color: $warm-ink;
    white-space: nowrap;
    pointer-events: none;
}

.hero-chip-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
    background: $warm-accent;
}

/*——————下方编号条—————— */

.hero-strip {
    display: grid;
    gap: 24px;
    padding: 22px 8px 0;
}

.home-hero .strip-item {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
    text-align: left;

    &:hover .strip-title {
        color: $warm-ink;
    }

    &.active {
        .strip-num {
            color: $warm-accent;
        }

        .strip-title {
            color: $warm-ink;
        }
    }

    &:focus-visible {
        outline: 2px solid $warm-accent;
        outline-offset: 4px;
        border-radius: 4px;
    }
}

.strip-track {
    position: relative;
    display: block;
    height: 2px;
    border-radius: 2px;
    overflow: hidden;
    background: #E6E8EE;
}

.strip-progress {
    position: absolute;
    inset: 0;
    background: $warm-accent;
    transform: scaleX(0);
    transform-origin: left center;
    animation: hero-progress linear forwards;
}

.home-hero:hover .strip-progress,
.home-hero.is-paused .strip-progress {
    animation-play-state: paused;
}

.strip-row {
    display: flex;
    align-items: baseline;
    gap: 12px;
    min-width: 0;
}

.strip-num {
    flex-shrink: 0;
    font-family: $warm-font-mono;
    font-size: 12px;
    color: $warm-ink-5;
    transition: color 0.2s;
}

.strip-text {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
}

.strip-title {
    @include ellipsis;
    font-size: 14px;
    font-weight: 600;
    color: #4A4E5A;
    transition: color 0.2s;
}

.strip-creator {
    @include ellipsis;
    font-size: 12px;
    color: $warm-ink-4;
}

/*——————骨架屏—————— */

.is-skeleton {
    .sk {
        display: block;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.16);
        animation: hero-skeleton-pulse 1.6s ease-in-out infinite;
    }

    .hero-media.sk {
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.12);
    }

    .sk-eyebrow {
        width: 180px;
        height: 12px;
    }

    .sk-title-group {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .sk-title {
        width: 88%;
        height: 52px;
        border-radius: 12px;

        &.short {
            width: 56%;
        }
    }

    .sk-desc {
        width: 72%;
        height: 16px;
    }

    .sk-creator {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .sk-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
    }

    .sk-name {
        width: 120px;
        height: 14px;
    }

    .sk-button {
        width: 150px;
        height: 52px;
        border-radius: 999px;

        &.secondary {
            width: 112px;
        }
    }

    .strip-item {
        cursor: default;
    }

    .strip-text {
        flex: 1;
        gap: 7px;
    }

    .sk-line {
        display: block;
        border-radius: 6px;
        background: $warm-sunken;
        animation: hero-skeleton-pulse 1.6s ease-in-out infinite;
    }

    .sk-strip-title {
        width: 82%;
        height: 12px;
    }

    .sk-strip-creator {
        width: 48%;
        height: 10px;
    }
}

@media (prefers-reduced-motion: reduce) {
    .hero-cover.is-active {
        transition: none;
    }

    .hero-swap-enter-active,
    .hero-swap-leave-active {
        transition: none;
    }

    .is-skeleton .sk,
    .is-skeleton .sk-line {
        animation: none;
    }
}
</style>
