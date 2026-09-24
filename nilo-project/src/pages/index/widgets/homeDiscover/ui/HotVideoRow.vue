<script setup lang="ts">
import type { VideoInfo } from '@/shared/model/VideoInfo'
import { formatCount } from '@/shared/utils/NumberUtil'
import { imgRequestUrl } from '@/shared/utils/ImgUtil'
import { computed, ref, watch } from 'vue'

const props = defineProps<{
    videoInfo: VideoInfo,
    /** 名次，从 1 开始 */
    rank: number,
}>()

const creator = computed(() => props.videoInfo.briefUserInfo ?? props.videoInfo.userInfo ?? null)

const videoPath = computed(() => `/video/${props.videoInfo.videoId ?? ''}`)
const title = computed(() => (props.videoInfo.videoName ?? '').replace(/<[^>]*>/g, ''))
const rankText = computed(() => String(props.rank).padStart(2, '0'))
const subText = computed(() =>
    `${creator.value?.nickName || '未知UP主'} · ${formatCount(props.videoInfo.playCount)}播放`,
)
// 第一名陶土色，二三名墨色，其余弱化
const rankLevel = computed(() =>
{
    if (props.rank === 1) return 'rank-first'
    if (props.rank <= 3) return 'rank-top'
    return 'rank-rest'
})

/*——————缩略图加载失败时回退原图，最终露出占位底色—————— */

const coverFailCount = ref(0)
const coverLoaded = ref(false)

const coverSrc = computed(() =>
{
    const cover = props.videoInfo.videoCover
    if (!cover) return ''
    if (coverFailCount.value === 0) return imgRequestUrl(cover, true)
    if (coverFailCount.value === 1) return imgRequestUrl(cover)
    return ''
})

watch(() => props.videoInfo.videoCover, () =>
{
    coverFailCount.value = 0
})

watch(coverSrc, () =>
{
    coverLoaded.value = false
})
</script>

<template>
    <RouterLink class="hot-video-row" :to="videoPath" target="_blank" :title="title">
        <span :class="['rank', rankLevel]">{{ rankText }}</span>
        <span class="thumb">
            <img v-if="coverSrc" :class="{ loaded: coverLoaded }" :src="coverSrc" alt="" loading="lazy"
                @load="coverLoaded = true" @error="coverFailCount++">
        </span>
        <span class="text">
            <span class="title">{{ title }}</span>
            <span class="sub">{{ subText }}</span>
        </span>
    </RouterLink>
</template>

<style lang="scss" scoped>
.hot-video-row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 0;
    border-top: 1px solid $warm-line-soft;
    color: $warm-ink;
    text-decoration: none;

    &:hover .title {
        color: $warm-accent-hover;
    }

    &:focus-visible {
        outline: 2px solid $warm-accent;
        outline-offset: 2px;
        border-radius: 8px;
    }
}

.rank {
    width: 26px;
    flex-shrink: 0;
    font-size: 18px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    line-height: 1;

    &.rank-first {
        color: $warm-accent-strong;
    }

    &.rank-top {
        color: $warm-ink;
    }

    &.rank-rest {
        color: $warm-ink-5;
    }
}

.thumb {
    position: relative;
    width: 88px;
    height: 50px;
    border-radius: 8px;
    flex-shrink: 0;
    overflow: hidden;
    background: $warm-sunken;

    img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0;
        transition: opacity 0.3s ease;

        &.loaded {
            opacity: 1;
        }
    }
}

.text {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-width: 0;
}

.title,
.sub {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.title {
    font-size: 14px;
    font-weight: 600;
    color: $warm-ink;
    transition: color 0.2s;
}

.sub {
    font-size: 12px;
    color: $warm-ink-4;
}
</style>
