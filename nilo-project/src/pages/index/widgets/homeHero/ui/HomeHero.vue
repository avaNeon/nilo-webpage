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
    cover: string | null
    creatorPath: string | null
    creatorName: string
    avatar: string | null
    metaText: string
    playCountText: string
    danmakuCountText: string
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
    const metaText = [getCategoryLabel(videoInfo), relativeDay ? `${relativeDay}更新` : '']
        .filter(Boolean)
        .join(' · ')
    return {
        key: videoInfo.videoId ?? index,
        videoPath: `/video/${videoInfo.videoId ?? ''}`,
        title: (videoInfo.videoName ?? '').replace(/<[^>]*>/g, ''),
        cover: videoInfo.videoCover,
        creatorPath: creator?.userId ? `/user/${creator.userId}` : null,
        creatorName: creator?.nickName || '未知UP主',
        avatar: creator?.avatar ?? null,
        metaText,
        playCountText: formatCount(videoInfo.playCount),
        danmakuCountText: formatCount(videoInfo.danmakuCount),
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
const counterText = computed(() =>
{
    const pad = (value: number) => value.toString().padStart(2, '0')
    return `${pad(activeIndex.value + 1)} / ${pad(slideViews.value.length)}`
})

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

/*——————图片加载状态：封面加载完才显示，失败时逐级回退到占位底色—————— */

const coverState = ref<Record<number, 'loaded' | 'failed'>>({})
const thumbFailCount = ref<Record<number, number>>({})
const avatarFailed = ref<Record<number, boolean>>({})

watch(() => props.slides, () =>
{
    activeIndex.value = 0
    prevIndex.value = null
    progressCycle.value++
    coverState.value = {}
    thumbFailCount.value = {}
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

// 小图优先用缩略图，缩略图缺失时回退原图
function thumbSrc(index: number): string
{
    const cover = slideViews.value[index]?.cover
    const failCount = thumbFailCount.value[index] ?? 0
    if (!cover || failCount > 1)
    {
        return ''
    }
    return imgRequestUrl(cover, failCount === 0)
}

function onThumbError(index: number)
{
    thumbFailCount.value[index] = (thumbFailCount.value[index] ?? 0) + 1
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
                <div class="hero-top">
                    <span class="sk sk-eyebrow"></span>
                    <span class="sk-title-group">
                        <span class="sk sk-title"></span>
                        <span class="sk sk-title short"></span>
                    </span>
                    <span class="sk sk-meta"></span>
                    <span class="sk-creator">
                        <span class="sk sk-avatar"></span>
                        <span class="sk sk-stats"></span>
                    </span>
                </div>
                <div class="hero-bottom">
                    <span class="hero-actions">
                        <span class="sk sk-button"></span>
                        <span class="sk sk-button secondary"></span>
                    </span>
                    <span class="sk sk-counter"></span>
                </div>
            </div>
            <div class="hero-media sk"></div>
        </div>
        <div class="hero-strip" :style="{ gridTemplateColumns: `repeat(${CAROUSEL_VIDEO_COUNT}, minmax(0, 1fr))` }">
            <div v-for="index in CAROUSEL_VIDEO_COUNT" :key="index" class="strip-item">
                <span class="strip-thumb sk"></span>
                <span class="strip-text">
                    <span class="sk sk-strip-title"></span>
                    <span class="sk sk-strip-creator"></span>
                </span>
            </div>
        </div>
    </section>

    <section v-else-if="activeView" :class="['home-hero', { 'is-paused': pageHidden }]"
        aria-roledescription="carousel" aria-label="精选推荐">
        <div class="hero-card">
            <div class="hero-info">
                <div class="hero-top">
                    <span class="hero-eyebrow"><span class="hero-eyebrow-dot"></span>精选推荐 · EDITOR'S PICK</span>
                    <Transition name="hero-swap" mode="out-in">
                        <div :key="activeIndex" class="hero-text">
                            <h1 class="hero-title">
                                <RouterLink :to="activeView.videoPath" target="_blank" :title="activeView.title">
                                    {{ activeView.title }}
                                </RouterLink>
                            </h1>
                            <p v-if="activeView.metaText" class="hero-meta">{{ activeView.metaText }}</p>
                            <div class="hero-creator">
                                <component :is="activeView.creatorPath ? RouterLink : 'span'" class="creator-link"
                                    v-bind="activeView.creatorPath ? { to: activeView.creatorPath, target: '_blank' } : {}">
                                    <span class="creator-avatar">
                                        <img v-if="activeAvatarSrc" :src="activeAvatarSrc" alt=""
                                            @error="onAvatarError">
                                    </span>
                                    <span class="creator-text">
                                        <span class="creator-name">{{ activeView.creatorName }}</span>
                                        <span class="creator-role">UP 主</span>
                                    </span>
                                </component>
                                <span class="hero-divider"></span>
                                <div class="hero-stats">
                                    <span class="hero-stat">
                                        <span class="hero-stat-value">{{ activeView.playCountText }}</span>播放
                                    </span>
                                    <span class="hero-stat">
                                        <span class="hero-stat-value">{{ activeView.danmakuCountText }}</span>弹幕
                                    </span>
                                    <span class="hero-stat">
                                        <span class="hero-stat-value">{{ activeView.durationText }}</span>时长
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Transition>
                </div>
                <div class="hero-bottom">
                    <div class="hero-actions">
                        <RouterLink class="hero-button primary" :to="activeView.videoPath" target="_blank">
                            <span class="play-icon"></span>立即观看
                        </RouterLink>
                        <RouterLink v-if="activeView.creatorPath" class="hero-button secondary"
                            :to="activeView.creatorPath" target="_blank">UP 主主页</RouterLink>
                    </div>
                    <span class="hero-counter">{{ counterText }}</span>
                </div>
            </div>

            <div class="hero-media">
                <!-- 所有封面叠放预加载，切换时交叉淡入 -->
                <RouterLink class="hero-cover-link" :to="activeView.videoPath" target="_blank" tabindex="-1"
                    :aria-label="activeView.title">
                    <template v-for="(view, index) in slideViews" :key="view.key">
                        <img v-if="view.cover && coverState[index] !== 'failed'" :class="['hero-cover', coverClass(index)]"
                            :src="imgRequestUrl(view.cover)" alt="" @load="onCoverLoad(index)"
                            @error="onCoverError(index)">
                    </template>
                </RouterLink>
                <div v-if="slideViews.length > 1" class="hero-dots">
                    <button v-for="(view, index) in slideViews" :key="view.key" type="button"
                        :class="['hero-dot', { active: index === activeIndex }]" :aria-label="`第 ${index + 1} 个`"
                        :aria-current="index === activeIndex ? 'true' : undefined" @click="goTo(index)"></button>
                </div>
            </div>
        </div>

        <div v-if="slideViews.length > 1" class="hero-strip"
            :style="{ gridTemplateColumns: `repeat(${slideViews.length}, minmax(0, 1fr))` }">
            <button v-for="(view, index) in slideViews" :key="view.key" type="button"
                :class="['strip-item', { active: index === activeIndex }]"
                :aria-current="index === activeIndex ? 'true' : undefined" @click="goTo(index)">
                <span class="strip-thumb">
                    <img v-if="thumbSrc(index)" :src="thumbSrc(index)" alt="" @error="onThumbError(index)">
                </span>
                <span class="strip-text">
                    <span class="strip-title">{{ view.title }}</span>
                    <span class="strip-creator">{{ view.creatorName }}</span>
                </span>
                <span v-if="index === activeIndex" :key="`progress-${progressCycle}`" class="strip-progress"
                    :style="{ animationDuration: `${AUTOPLAY_INTERVAL}ms` }" @animationend="onProgressEnd"></span>
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

.home-hero {
    display: flex;
    flex-direction: column;
    gap: 12px;

    button {
        padding: 0;
        border: none;
        background: transparent;
        font: inherit;
        color: inherit;
        cursor: pointer;
    }
}

.hero-card {
    display: grid;
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    height: 480px;
    border-radius: 24px;
    overflow: hidden;
    background: $warm-card;
    box-shadow: $warm-shadow-card;
}

/*——————左侧信息—————— */

.hero-info {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-width: 0;
    padding: 44px 48px;
}

.hero-top,
.hero-text {
    display: flex;
    flex-direction: column;
    gap: 22px;
    min-width: 0;
}

.hero-eyebrow {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: $warm-font-mono;
    font-size: 14px;
    letter-spacing: 0.14em;
    color: $warm-ink-3;
}

.hero-eyebrow-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: $warm-accent;
}

.hero-title {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    overflow-wrap: anywhere;
    margin: 0;
    font-size: 44px;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.02em;
    text-wrap: pretty;
    color: $warm-ink;

    a {
        transition: color 0.2s;

        &:hover {
            color: $warm-accent-hover;
        }
    }
}

.hero-meta {
    margin: 0;
    font-size: 15px;
    line-height: 1.6;
    color: $warm-ink-3;
}

.hero-creator {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    margin-top: 4px;
}

.creator-link {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    color: $warm-ink;

    &:is(a):hover .creator-name {
        color: $warm-accent-hover;
    }
}

.creator-avatar {
    position: relative;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    flex-shrink: 0;
    overflow: hidden;
    background: linear-gradient(140deg, oklch(0.93 0.035 60), oklch(0.83 0.055 90));

    &::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        box-shadow: inset 0 0 0 1px rgba(26, 25, 22, 0.06);
        pointer-events: none;
    }

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
    max-width: 140px;
    font-size: 14px;
    font-weight: 600;
    transition: color 0.2s;
}

.creator-role {
    font-size: 12px;
    color: $warm-ink-4;
}

.hero-divider {
    width: 1px;
    height: 28px;
    margin: 0 8px;
    flex-shrink: 0;
    background: $warm-border-strong;
}

.hero-stats {
    display: flex;
    gap: 22px;
    flex-shrink: 0;
}

.hero-stat {
    display: flex;
    flex-direction: column;
    gap: 1px;
    font-size: 12px;
    color: $warm-ink-4;
    white-space: nowrap;
}

.hero-stat-value {
    font-size: 15px;
    font-weight: 600;
    color: $warm-ink;
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
    height: 48px;
    border-radius: 14px;
    font-size: 15px;
    font-weight: 500;
    white-space: nowrap;
    transition: background 0.2s, border-color 0.2s;

    &:focus-visible {
        outline: 2px solid $warm-ink;
        outline-offset: 2px;
    }

    &.primary {
        gap: 10px;
        padding: 0 24px 0 20px;
        background: $warm-ink;
        color: #FFFFFF;
        box-shadow: 0 8px 20px -10px rgba(26, 25, 22, 0.5);

        &:hover {
            background: #000000;
        }
    }

    &.secondary {
        padding: 0 20px;
        border: 1px solid $warm-border-strong;
        background: #FFFFFF;
        color: $warm-ink;

        &:hover {
            border-color: $warm-ink;
        }
    }
}

.play-icon {
    width: 0;
    height: 0;
    border-left: 10px solid #FFFFFF;
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
}

.hero-counter {
    font-family: $warm-font-mono;
    font-size: 12px;
    letter-spacing: 0.08em;
    color: $warm-ink-4;
    white-space: nowrap;
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
    overflow: hidden;
    background: $warm-sunken;
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

.hero-dots {
    position: absolute;
    left: 24px;
    bottom: 24px;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 9px 12px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.6);
}

.home-hero .hero-dot {
    position: relative;
    width: 4px;
    height: 4px;
    border-radius: 999px;
    background: rgba(26, 25, 22, 0.3);
    transition: width 0.3s ease, background 0.3s ease;

    // 扩大点击区域，不影响排版
    &::before {
        content: '';
        position: absolute;
        inset: -9px -3px;
    }

    &.active {
        width: 20px;
        background: $warm-ink;
    }

    &:focus-visible {
        outline: 2px solid $warm-ink;
        outline-offset: 3px;
    }
}

/*——————底部缩略条—————— */

.hero-strip {
    display: grid;
    gap: 12px;
}

.home-hero .strip-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
    padding: 10px;
    border-radius: 16px;
    overflow: hidden;
    text-align: left;
    transition: background 0.2s, box-shadow 0.2s;

    &:hover {
        background: rgba(255, 255, 255, 0.6);
    }

    &.active {
        background: #FFFFFF;
        box-shadow: $warm-shadow-chip;

        .strip-title {
            color: $warm-ink;
        }
    }

    &:focus-visible {
        outline: 2px solid $warm-ink;
        outline-offset: 2px;
    }
}

.strip-thumb {
    position: relative;
    width: 72px;
    height: 46px;
    border-radius: 9px;
    flex-shrink: 0;
    overflow: hidden;
    background: $warm-sunken;

    img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
}

.strip-text {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
}

.strip-title {
    @include ellipsis;
    font-size: 13px;
    font-weight: 600;
    color: $warm-ink-3;
    transition: color 0.2s;
}

.strip-creator {
    @include ellipsis;
    font-size: 12px;
    color: $warm-ink-4;
}

.strip-progress {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 2px;
    background: $warm-accent;
    transform: scaleX(0);
    transform-origin: left center;
    animation: hero-progress linear forwards;
}

.home-hero:hover .strip-progress,
.home-hero.is-paused .strip-progress {
    animation-play-state: paused;
}

/*——————骨架屏—————— */

.is-skeleton {
    .sk {
        display: block;
        border-radius: 8px;
        background: $warm-sunken;
        animation: hero-skeleton-pulse 1.6s ease-in-out infinite;
    }

    .hero-media.sk {
        border-radius: 0;
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
        height: 42px;
        border-radius: 10px;

        &.short {
            width: 56%;
        }
    }

    .sk-meta {
        width: 200px;
        height: 16px;
    }

    .sk-creator {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 4px;
    }

    .sk-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
    }

    .sk-stats {
        width: 240px;
        height: 30px;
    }

    .sk-button {
        width: 136px;
        height: 48px;
        border-radius: 14px;

        &.secondary {
            width: 112px;
        }
    }

    .sk-counter {
        width: 64px;
        height: 12px;
    }

    .strip-item {
        cursor: default;

        &:hover {
            background: transparent;
        }
    }

    .strip-thumb.sk {
        border-radius: 9px;
    }

    .strip-text {
        flex: 1;
        gap: 7px;
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

    .is-skeleton .sk {
        animation: none;
    }
}
</style>
