<script setup lang="ts">
import type { VideoInfo } from '@/shared/model/VideoInfo'
import { formatCount } from '@/shared/utils/NumberUtil'
import { formatDurationClock } from '@/shared/utils/DateUtil'
import { imgRequestUrl } from '@/shared/utils/ImgUtil'
import { routerToNewPage } from '@/shared/utils/RouteUtil'
import { computed, ref, watch } from 'vue'

const props = defineProps<{
    videoInfo: VideoInfo,
    /** 名次，从 1 开始 */
    rank: number,
}>()

// 列表接口只返回 briefUserInfo，详情接口返回 userInfo
const creator = computed(() => props.videoInfo.briefUserInfo ?? props.videoInfo.userInfo ?? null)

const videoPath = computed(() => `/video/${props.videoInfo.videoId ?? ''}`)
const title = computed(() => (props.videoInfo.videoName ?? '').replace(/<[^>]*>/g, ''))
const creatorName = computed(() => creator.value?.nickName || '未知UP主')
const hasDuration = computed(() => props.videoInfo.duration != null)
const durationText = computed(() => formatDurationClock(props.videoInfo.duration))

/*——————图片加载失败时逐级回退，最终露出占位底色—————— */

const coverFailCount = ref(0)
const coverLoaded = ref(false)
const avatarFailed = ref(false)

// 先用缩略图，缺失时回退原图
const coverSrc = computed(() =>
{
    const cover = props.videoInfo.videoCover
    if (!cover) return ''
    if (coverFailCount.value === 0) return imgRequestUrl(cover, true)
    if (coverFailCount.value === 1) return imgRequestUrl(cover)
    return ''
})

const avatarSrc = computed(() =>
    avatarFailed.value ? '' : imgRequestUrl(creator.value?.avatar, true),
)

watch(() => props.videoInfo.videoCover, () =>
{
    coverFailCount.value = 0
})

watch(coverSrc, () =>
{
    coverLoaded.value = false
})

watch(() => creator.value?.avatar, () =>
{
    avatarFailed.value = false
})

function toUserPage()
{
    const userId = creator.value?.userId
    if (userId)
    {
        routerToNewPage(`/user/${userId}`)
    }
}
</script>

<template>
    <!-- 榜单行：细体大号名次 + 封面 + 标题/UP 主/数据 -->
    <RouterLink :class="['hot-rank-item', { top: rank <= 3 }]" :to="videoPath" target="_blank" :title="title">
        <span :class="['rank', { long: rank >= 100 }]">{{ rank }}</span>
        <span class="cover">
            <img v-if="coverSrc" :class="{ loaded: coverLoaded }" :src="coverSrc" alt="" loading="lazy"
                @load="coverLoaded = true" @error="coverFailCount++">
            <span v-if="hasDuration" class="duration">{{ durationText }}</span>
        </span>
        <span class="text">
            <span class="title">{{ title }}</span>
            <span class="creator" @click.prevent.stop="toUserPage">
                <span class="avatar">
                    <img v-if="avatarSrc" :src="avatarSrc" alt="" loading="lazy" @error="avatarFailed = true">
                </span>
                <span class="creator-name">{{ creatorName }}</span>
            </span>
            <span class="stats">
                <span><b>{{ formatCount(videoInfo.playCount) }}</b> 播放</span>
                <span class="dot" aria-hidden="true"></span>
                <span><b>{{ formatCount(videoInfo.danmakuCount) }}</b> 弹幕</span>
            </span>
        </span>
    </RouterLink>
</template>

<style lang="scss" scoped>
// 封面占位：冷灰渐变
$cover-placeholder: linear-gradient(160deg, oklch(0.93 0.008 265), oklch(0.83 0.014 265));

.hot-rank-item {
    display: grid;
    grid-template-columns: 64px 272px minmax(0, 1fr);
    gap: 20px;
    align-items: start;
    min-width: 0;
    margin: 0 -12px;
    padding: 12px;
    border-radius: 22px;
    color: $warm-ink;
    text-decoration: none;
    transition: background-color 0.2s;

    &:hover {
        background: $warm-sunken;

        .title {
            color: $warm-accent;
        }

        .cover img {
            transform: scale(1.03);
        }
    }

    &:focus-visible {
        outline: 2px solid $warm-accent;
        outline-offset: 2px;
    }
}

// 前三名蓝色，其余浅灰
.rank {
    padding-top: 4px;
    font-size: 56px;
    font-weight: 200;
    line-height: 0.9;
    letter-spacing: -0.05em;
    color: $warm-ink-5;

    // 三位数放不下 64px 的列，缩小一号
    &.long {
        font-size: 40px;
    }

    .top & {
        color: $warm-accent;
    }
}

.cover {
    position: relative;
    display: block;
    aspect-ratio: 16 / 9;
    border-radius: 16px;
    overflow: hidden;
    isolation: isolate;
    background: $cover-placeholder;

    img {
        position: absolute;
        inset: 0;
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0;
        transition: transform 0.4s ease, opacity 0.3s ease;

        &.loaded {
            opacity: 1;
        }
    }

    .duration {
        position: absolute;
        right: 10px;
        bottom: 10px;
        padding: 3px 7px;
        border-radius: 6px;
        background: rgba(11, 12, 18, 0.7);
        color: #FFFFFF;
        font-size: 11px;
        font-weight: 500;
    }
}

.text {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
    padding-top: 4px;
}

.title {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    overflow-wrap: anywhere;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.5;
    text-wrap: pretty;
    transition: color 0.2s;
}

.creator {
    display: flex;
    align-items: center;
    gap: 8px;
    align-self: flex-start;
    max-width: 100%;
    font-size: 12px;
    cursor: pointer;

    &:hover .creator-name {
        color: $warm-accent;
    }

    .avatar {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        overflow: hidden;
        background: $cover-placeholder;

        img {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    }

    .creator-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-weight: 500;
        color: $warm-ink-3;
        transition: color 0.2s;
    }
}

.stats {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12px;
    color: $warm-ink-4;
    white-space: nowrap;

    b {
        font-weight: 600;
        color: $warm-ink;
    }

    .dot {
        width: 3px;
        height: 3px;
        border-radius: 50%;
        background: $warm-dot;
    }
}
</style>
