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
const creatorName = computed(() => creator.value?.nickName || '未知UP主')
const playCountText = computed(() => `${formatCount(props.videoInfo.playCount)}播放`)

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
    <!-- 热门榜卡片：细体大号名次 + 封面 + 标题 -->
    <RouterLink class="hot-video-card" :to="videoPath" target="_blank" :title="title">
        <span class="rank-row">
            <span class="rank">{{ rank }}</span>
            <span class="views">{{ playCountText }}</span>
        </span>
        <span class="thumb">
            <img v-if="coverSrc" :class="{ loaded: coverLoaded }" :src="coverSrc" alt="" loading="lazy"
                @load="coverLoaded = true" @error="coverFailCount++">
        </span>
        <span class="text">
            <span class="title">{{ title }}</span>
            <span class="creator">{{ creatorName }}</span>
        </span>
    </RouterLink>
</template>

<style lang="scss" scoped>
.hot-video-card {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
    color: $warm-ink;
    text-decoration: none;

    &:hover {
        .title {
            color: $warm-accent;
        }

        .thumb img {
            transform: scale(1.03);
        }
    }

    &:focus-visible {
        outline: 2px solid $warm-accent;
        outline-offset: 4px;
        border-radius: 14px;
    }
}

.rank-row {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
}

.rank {
    font-size: 56px;
    font-weight: 200;
    font-variant-numeric: tabular-nums;
    line-height: 0.8;
    letter-spacing: -0.05em;
    color: $warm-accent;
}

.views {
    font-size: 12px;
    color: $warm-ink-4;
    white-space: nowrap;
}

.thumb {
    position: relative;
    aspect-ratio: 16 / 9;
    border-radius: 14px;
    overflow: hidden;
    isolation: isolate;
    background: linear-gradient(160deg, oklch(0.93 0.008 265), oklch(0.83 0.014 265));

    img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0;
        transition: opacity 0.3s ease, transform 0.4s ease;

        &.loaded {
            opacity: 1;
        }
    }
}

.text {
    display: flex;
    flex-direction: column;
    gap: 5px;
    min-width: 0;
}

.title {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    overflow-wrap: anywhere;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.5;
    transition: color 0.2s;
}

.creator {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    color: $warm-ink-4;
}
</style>
