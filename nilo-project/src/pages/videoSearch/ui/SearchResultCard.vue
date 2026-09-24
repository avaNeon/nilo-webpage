<script setup lang="ts">
import type { VideoInfo } from '@/shared/model/VideoInfo'
import { formatCount } from '@/shared/utils/NumberUtil'
import { formatDurationClock, formatRelativeDay } from '@/shared/utils/DateUtil'
import { imgRequestUrl } from '@/shared/utils/ImgUtil'
import { sanitizeHighlightHtml } from '@/shared/utils/HighlightUtil'
import { routerToNewPage } from '@/shared/utils/RouteUtil'
import { computed, ref, watch } from 'vue'

const props = defineProps<{
    videoInfo: VideoInfo,
}>()

const creator = computed(() => props.videoInfo.briefUserInfo ?? props.videoInfo.userInfo ?? null)

const videoPath = computed(() => `/video/${props.videoInfo.videoId ?? ''}`)
// 标题里命中的关键词由后端包好 <span class="highlight">，转义后只留这一种标签
const titleHtml = computed(() => sanitizeHighlightHtml(props.videoInfo.videoName ?? ''))
const titleText = computed(() => (props.videoInfo.videoName ?? '').replace(/<[^>]*>/g, ''))
const creatorName = computed(() => creator.value?.nickName || '未知UP主')
const hasDuration = computed(() => props.videoInfo.duration != null)
const durationText = computed(() => formatDurationClock(props.videoInfo.duration))
const updatedText = computed(() => formatRelativeDay(props.videoInfo.lastUpdateTime ?? props.videoInfo.createTime))

/*——————图片加载失败时回退原图，最终露出占位底色—————— */

const coverFailCount = ref(0)
const coverLoaded = ref(false)
const avatarFailed = ref(false)

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
    <div class="search-result-card">
        <RouterLink class="cover" :to="videoPath" target="_blank" :aria-label="titleText" tabindex="-1">
            <img v-if="coverSrc" :class="{ loaded: coverLoaded }" :src="coverSrc" alt="" loading="lazy"
                @load="coverLoaded = true" @error="coverFailCount++">
            <!-- 底部压暗，放播放/弹幕数 -->
            <span class="shade" aria-hidden="true"></span>
            <span class="stats">
                <span>{{ formatCount(videoInfo.playCount) }} 播放</span>
                <span>{{ formatCount(videoInfo.danmakuCount) }} 弹幕</span>
            </span>
            <span v-if="hasDuration" class="duration">{{ durationText }}</span>
        </RouterLink>
        <div class="text">
            <RouterLink class="title" :to="videoPath" target="_blank" :title="titleText">
                <span v-html="titleHtml"></span>
            </RouterLink>
            <span class="meta">
                <span class="avatar" :title="creatorName" @click="toUserPage">
                    <img v-if="avatarSrc" :src="avatarSrc" alt="" loading="lazy" @error="avatarFailed = true">
                </span>
                <span class="creator" @click="toUserPage">{{ creatorName }}</span>
                <span v-if="updatedText" class="updated">{{ updatedText }}</span>
            </span>
        </div>
    </div>
</template>

<style lang="scss" scoped>
// 封面占位：冷灰渐变
$cover-placeholder: linear-gradient(160deg, oklch(0.93 0.008 265), oklch(0.83 0.014 265));

.search-result-card {
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

    .shade {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 44%;
        background: linear-gradient(180deg, rgba(11, 12, 18, 0), rgba(11, 12, 18, 0.5));
        pointer-events: none;
    }

    .stats {
        position: absolute;
        left: 12px;
        bottom: 10px;
        display: flex;
        gap: 12px;
        color: #FFFFFF;
        font-size: 11px;
        font-weight: 500;
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
    gap: 8px;
    min-width: 0;
}

.title {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    overflow-wrap: anywhere;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.5;
    color: $warm-ink;
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
        color: $warm-accent;
    }

    // 命中的关键词标蓝
    :deep(.highlight) {
        color: $warm-accent;
    }
}

.meta {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    font-size: 12px;
    color: $warm-ink-4;
    white-space: nowrap;

    .avatar {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        overflow: hidden;
        background: $cover-placeholder;
        cursor: pointer;

        img {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    }

    .creator {
        overflow: hidden;
        text-overflow: ellipsis;
        font-weight: 500;
        color: $warm-ink-3;
        cursor: pointer;
        transition: color 0.2s;

        &:hover {
            color: $warm-accent;
        }
    }

    .updated {
        flex-shrink: 0;
    }
}
</style>
