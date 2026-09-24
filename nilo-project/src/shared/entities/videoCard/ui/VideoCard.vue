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
     * featured: 首页「为你推荐」第一个，占两行两列的大卡片
     * list: 左侧小封面、右侧信息，用于播放页「更多推荐」
     */
    layout?: 'grid' | 'featured' | 'list',
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
/** 播放量 · 几天前 */
const statText = computed(() =>
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
            <span v-if="updatedToday" class="badge">今日更新</span>
            <span v-if="hasDuration" class="duration">{{ durationText }}</span>
        </RouterLink>
        <div class="text">
            <RouterLink class="title" :to="videoPath" target="_blank" :title="title">{{ title }}</RouterLink>
            <span class="meta">
                <span class="avatar" :title="creatorName" @click="toUserPage">
                    <img v-if="avatarSrc" :src="avatarSrc" alt="" loading="lazy" @error="avatarFailed = true">
                </span>
                <span class="creator" @click="toUserPage">{{ creatorName }}</span>
                <span class="stat">{{ statText }}</span>
            </span>
        </div>
    </div>

    <RouterLink v-else-if="layout === 'featured'" class="video-card video-card-featured" :to="videoPath"
        target="_blank" :title="title">
        <span class="cover">
            <img v-if="coverSrc" :class="{ loaded: coverLoaded }" :src="coverSrc" alt="" loading="lazy"
                @load="coverLoaded = true" @error="onCoverError">
            <span class="badge">{{ updatedToday ? '今日更新' : '编辑推荐' }}</span>
            <span class="play-circle" aria-hidden="true"><span class="play-icon"></span></span>
            <span v-if="hasDuration" class="duration">{{ durationText }}</span>
        </span>
        <span class="foot">
            <span class="text">
                <span class="title">{{ title }}</span>
                <span class="meta">
                    <span class="creator" @click.prevent.stop="toUserPage">{{ creatorName }}</span>
                    · {{ statText }}
                </span>
            </span>
            <span class="arrow" aria-hidden="true">→</span>
        </span>
    </RouterLink>

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
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
        color: $warm-accent;
    }
}

// 封面图：加载完再淡入，悬停微微放大
@mixin cover-image {
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
}

.video-card img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

// 封面占位：冷灰渐变
$cover-placeholder: linear-gradient(160deg, oklch(0.93 0.008 265), oklch(0.83 0.014 265));

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

/*——————网格卡片—————— */

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
        border-radius: 16px;
        overflow: hidden;
        isolation: isolate;
        background: $cover-placeholder;

        @include cover-image;
    }

    .badge {
        position: absolute;
        right: 10px;
        top: 10px;
        display: flex;
        align-items: center;
        height: 22px;
        padding: 0 9px;
        border-radius: 999px;
        background: $warm-accent;
        color: #FFFFFF;
        font-size: 11px;
        font-weight: 600;
    }

    .text {
        display: flex;
        flex-direction: column;
        gap: 8px;
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
            color: $warm-accent;
        }
    }

    // 头像 + UP 主 + 播放量，一行排下
    .meta {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
        font-size: 12px;
        color: $warm-ink-4;
    }

    .avatar {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        flex-shrink: 0;
        overflow: hidden;
        background: linear-gradient(140deg, oklch(0.9 0.008 265), oklch(0.78 0.012 265));
        cursor: pointer;
    }

    .creator {
        @include single-line-link;
        flex-shrink: 1;
        font-weight: 500;
        color: $warm-ink-3;
    }

    .stat {
        flex-shrink: 0;
        white-space: nowrap;
    }
}

/*——————大卡片（两行两列）—————— */

.video-card-featured {
    grid-column: span 2;
    grid-row: span 2;
    display: flex;
    flex-direction: column;
    gap: 18px;
    min-width: 0;
    color: $warm-ink;
    text-decoration: none;

    &:hover {
        .cover img {
            transform: scale(1.02);
        }

        .title {
            color: $warm-accent;
        }

        .arrow {
            background: $warm-accent;
            color: #FFFFFF;
        }
    }

    .cover {
        position: relative;
        flex: 1;
        min-height: 360px;
        border-radius: 22px;
        overflow: hidden;
        isolation: isolate;
        background: $cover-placeholder;

        @include cover-image;
    }

    .badge {
        position: absolute;
        right: 16px;
        top: 14px;
        display: flex;
        align-items: center;
        height: 26px;
        padding: 0 11px;
        border-radius: 999px;
        background: $warm-accent;
        color: #FFFFFF;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.02em;
    }

    .play-circle {
        position: absolute;
        left: 18px;
        bottom: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        padding-left: 4px;
        border-radius: 50%;
        background: #FFFFFF;
    }

    .play-icon {
        width: 0;
        height: 0;
        border-left: 13px solid $warm-accent;
        border-top: 8px solid transparent;
        border-bottom: 8px solid transparent;
    }

    .duration {
        right: 16px;
        bottom: 16px;
        padding: 4px 8px;
        border-radius: 7px;
        font-size: 12px;
    }

    .foot {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 24px;
    }

    .text {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 0;
    }

    .title {
        @include clamp-2;
        font-size: 24px;
        font-weight: 700;
        line-height: 1.35;
        letter-spacing: -0.01em;
        transition: color 0.2s;
    }

    .meta {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 13px;
        color: $warm-ink-4;
    }

    .creator {
        cursor: pointer;
        transition: color 0.2s;

        &:hover {
            color: $warm-accent;
        }
    }

    .arrow {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        flex-shrink: 0;
        border-radius: 50%;
        background: $warm-sunken;
        color: $warm-accent;
        font-size: 16px;
        transition: background-color 0.2s, color 0.2s;
    }
}

/*——————列表卡片—————— */

.video-card-list {
    display: flex;
    gap: 14px;
    padding: 8px;
    margin: 0 -8px;
    border-radius: 18px;
    color: $warm-ink;
    text-decoration: none;
    transition: background 0.2s;

    &:hover {
        background: $warm-sunken;
    }

    .thumb {
        position: relative;
        width: 164px;
        height: 92px;
        border-radius: 12px;
        flex-shrink: 0;
        overflow: hidden;
        background: $cover-placeholder;

        img {
            opacity: 0;
            transition: opacity 0.3s ease;

            &.loaded {
                opacity: 1;
            }
        }
    }

    .duration {
        right: 6px;
        bottom: 6px;
        padding: 2px 6px;
        border-radius: 5px;
    }

    .text {
        display: flex;
        flex-direction: column;
        gap: 6px;
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
        align-self: flex-start;
        font-size: 12px;
        font-weight: 500;
        color: $warm-ink-3;
    }

    .meta {
        font-size: 12px;
        color: $warm-ink-4;
    }
}
</style>
