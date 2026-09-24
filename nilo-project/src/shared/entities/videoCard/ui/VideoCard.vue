<script setup lang="ts">
import type { VideoInfo } from '@/shared/model/VideoInfo';
import { formatCount } from '@/shared/utils/NumberUtil';
import { formatDurationClock, formatRelativeDay, isToday } from '@/shared/utils/DateUtil';
import { imgRequestUrl } from '@/shared/utils/ImgUtil';
import { routerToNewPage } from '@/shared/utils/RouteUtil';
import { computed, ref, watch } from 'vue';

const props = withDefaults(defineProps<{
    videoInfo: VideoInfo,
    /**
     * grid: 封面在上、信息在下，用于首页视频网格
     * list: 左侧小封面、右侧信息，用于播放页「接下来播放」
     */
    layout?: 'grid' | 'list',
}>(), {
    layout: 'grid',
})

// 列表接口只返回 briefUserInfo，详情接口返回 userInfo
const creator = computed(() => props.videoInfo.briefUserInfo ?? props.videoInfo.userInfo ?? null)

const videoPath = computed(() => `/video/${props.videoInfo.videoId ?? ''}`)
const title = computed(() => (props.videoInfo.videoName ?? '').replace(/<[^>]*>/g, ''))
const creatorName = computed(() => creator.value?.nickName || '未知UP主')
const playCountText = computed(() => formatCount(props.videoInfo.playCount))
const hasDuration = computed(() => props.videoInfo.duration != null)
const durationText = computed(() => formatDurationClock(props.videoInfo.duration))

const updateTime = computed(() => props.videoInfo.lastUpdateTime ?? props.videoInfo.createTime)
const updatedToday = computed(() => isToday(updateTime.value))
const gridMetaText = computed(() =>
{
    const relativeDay = formatRelativeDay(updateTime.value)
    return relativeDay ? `${playCountText.value} 观看 · ${relativeDay}` : `${playCountText.value} 观看`
})

/*——————图片加载失败时逐级回退，最终露出占位底色—————— */

const coverFailCount = ref(0)
const coverLoaded = ref(false)
const avatarFailed = ref(false)

const coverSrc = computed(() =>
{
    const cover = props.videoInfo.videoCover
    if (!cover)
    {
        return ''
    }
    if (props.layout === 'list')
    {
        // 小封面优先用缩略图，缩略图缺失时回退原图
        if (coverFailCount.value === 0) return imgRequestUrl(cover, true)
        if (coverFailCount.value === 1) return imgRequestUrl(cover)
        return ''
    }
    return coverFailCount.value === 0 ? imgRequestUrl(cover) : ''
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

function onCoverError()
{
    coverFailCount.value++
}

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
    <div v-if="layout === 'grid'" class="video-card video-card-grid">
        <RouterLink class="cover" :to="videoPath" target="_blank" :aria-label="title" tabindex="-1">
            <img v-if="coverSrc" :class="{ loaded: coverLoaded }" :src="coverSrc" alt="" loading="lazy"
                @load="coverLoaded = true" @error="onCoverError">
            <span v-if="updatedToday" class="badge-today"><span class="badge-dot"></span>今日更新</span>
            <span v-if="hasDuration" class="duration">{{ durationText }}</span>
        </RouterLink>
        <div class="info">
            <span class="avatar" :title="creatorName" @click="toUserPage">
                <img v-if="avatarSrc" :src="avatarSrc" alt="" loading="lazy" @error="avatarFailed = true">
            </span>
            <div class="text">
                <RouterLink class="title" :to="videoPath" target="_blank" :title="title">{{ title }}</RouterLink>
                <span class="creator" @click="toUserPage">{{ creatorName }}</span>
                <span class="meta">{{ gridMetaText }}</span>
            </div>
        </div>
    </div>
    <RouterLink v-else class="video-card video-card-list" :to="videoPath" target="_blank" :title="title">
        <span class="thumb">
            <img v-if="coverSrc" :class="{ loaded: coverLoaded }" :src="coverSrc" alt="" loading="lazy"
                @load="coverLoaded = true" @error="onCoverError">
            <span v-if="hasDuration" class="duration">{{ durationText }}</span>
        </span>
        <span class="text">
            <span class="title">{{ title }}</span>
            <span class="creator" @click.prevent.stop="toUserPage">{{ creatorName }}</span>
            <span class="meta">{{ playCountText }} 观看</span>
        </span>
    </RouterLink>
</template>

<style lang="scss" scoped>
// 两行截断
@mixin clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    overflow-wrap: anywhere;
}

// 单行省略，且只让文字本身可点击
@mixin single-line-link {
    align-self: flex-start;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
        color: $warm-ink;
    }
}

.video-card img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.video-card-grid {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
    transition: transform 0.25s;

    &:hover {
        transform: translateY(-3px);

        .cover img {
            transform: scale(1.03);
        }
    }

    .cover {
        position: relative;
        display: block;
        aspect-ratio: 16 / 9;
        border-radius: 14px;
        overflow: hidden;
        isolation: isolate;
        background: $warm-sunken;

        // 描边放在伪元素上，避免被封面图盖住
        &::after {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: inherit;
            box-shadow: inset 0 0 0 1px rgba(26, 25, 22, 0.04);
            pointer-events: none;
        }

        img {
            position: absolute;
            inset: 0;
            opacity: 0;
            transition: transform 0.4s ease, opacity 0.3s ease;

            &.loaded {
                opacity: 1;
            }
        }
    }

    .badge-today {
        position: absolute;
        right: 10px;
        top: 10px;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 9px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.75);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        font-size: 11px;
        font-weight: 500;
        color: $warm-ink;
    }

    .badge-dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: $warm-accent;
    }

    .duration {
        position: absolute;
        right: 10px;
        bottom: 10px;
        padding: 3px 7px;
        border-radius: 6px;
        background: rgba(26, 25, 22, 0.62);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        color: #FFFFFF;
        font-size: 11px;
        font-weight: 500;
    }

    .info {
        display: flex;
        gap: 12px;
        min-width: 0;
    }

    .avatar {
        position: relative;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        flex-shrink: 0;
        overflow: hidden;
        background: linear-gradient(140deg, oklch(0.93 0.035 60), oklch(0.83 0.055 90));
        cursor: pointer;

        &::after {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: inherit;
            box-shadow: inset 0 0 0 1px rgba(26, 25, 22, 0.06);
            pointer-events: none;
        }
    }

    .text {
        display: flex;
        flex-direction: column;
        gap: 5px;
        min-width: 0;
    }

    .title {
        @include clamp-2;
        font-size: 15px;
        font-weight: 600;
        line-height: 1.5;
        color: $warm-ink;
        text-decoration: none;
        transition: color 0.2s;

        &:hover {
            color: $warm-accent-hover;
        }
    }

    .creator {
        @include single-line-link;
        font-size: 13px;
        color: $warm-ink-3;
    }

    .meta {
        font-size: 12px;
        color: $warm-ink-4;
    }
}

.video-card-list {
    display: flex;
    gap: 14px;
    padding: 8px;
    margin: 0 -8px;
    border-radius: 14px;
    color: $warm-ink;
    text-decoration: none;
    transition: background 0.2s;

    &:hover {
        background: #FFFFFF;
    }

    .thumb {
        position: relative;
        width: 160px;
        height: 90px;
        border-radius: 10px;
        flex-shrink: 0;
        overflow: hidden;
        background: $warm-sunken;

        img {
            opacity: 0;
            transition: opacity 0.3s ease;

            &.loaded {
                opacity: 1;
            }
        }
    }

    .duration {
        position: absolute;
        right: 6px;
        bottom: 6px;
        padding: 2px 6px;
        border-radius: 5px;
        background: rgba(26, 25, 22, 0.62);
        color: #FFFFFF;
        font-size: 11px;
        font-weight: 500;
    }

    .text {
        display: flex;
        flex-direction: column;
        gap: 5px;
        min-width: 0;
        padding-top: 2px;
    }

    .title {
        @include clamp-2;
        font-size: 14px;
        font-weight: 600;
        line-height: 1.5;
        color: $warm-ink;
    }

    .creator {
        @include single-line-link;
        font-size: 12px;
        color: $warm-ink-3;
    }

    .meta {
        font-size: 12px;
        color: $warm-ink-4;
    }
}
</style>
