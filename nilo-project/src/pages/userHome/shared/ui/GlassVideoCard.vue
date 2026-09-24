<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { formatCount } from '@/shared/utils/NumberUtil'
import { formatDurationClock } from '@/shared/utils/DateUtil'
import { imgRequestUrl } from '@/shared/utils/ImgUtil'
import { sanitizeHighlightHtml } from '@/shared/utils/HighlightUtil'
import TrashIcon from './TrashIcon.vue'

/** 卡片只用到这些字段，投稿、收藏、系列里的视频都满足 */
interface CardVideo
{
    videoId: string | null,
    videoCover: string | null,
    videoName: string | null,
    duration: number | null,
    playCount: number | null,
    danmakuCount: number | null,
}

const props = withDefaults(defineProps<{
    video: CardVideo,
    /** 「N 弹幕 · 」后面的内容：发布时间，或收藏来源 + 收藏时间 */
    meta?: string,
    /** 左上角显示删除按钮 */
    removable?: boolean,
    removeLabel?: string,
    /** 排序中：蓝色描边、可拖动、点了不跳转 */
    reordering?: boolean,
    /** 小号：首页系列行里用，没有悬停底色，封面上只有时长，下面写播放数 */
    compact?: boolean,
}>(), {
    meta: '',
    removable: false,
    removeLabel: '删除',
    reordering: false,
    compact: false,
})

const emit = defineEmits<{
    (e: 'remove'): void,
}>()

const linkable = computed(() => Boolean(props.video.videoId) && !props.reordering)
const linkAttrs = computed(() => linkable.value
    ? { to: `/video/${props.video.videoId}`, target: '_blank' }
    : {})

const titleHtml = computed(() => sanitizeHighlightHtml(props.video.videoName ?? ''))
const titleText = computed(() => (props.video.videoName ?? '').replace(/<[^>]*>/g, ''))
const hasDuration = computed(() => props.video.duration != null)

/*——————封面：先取缩略图，失败退回原图，再失败露出占位底色—————— */

const coverFailCount = ref(0)
const coverLoaded = ref(false)

const coverSrc = computed(() =>
{
    const cover = props.video.videoCover
    if (!cover) return ''
    if (coverFailCount.value === 0) return imgRequestUrl(cover, true)
    if (coverFailCount.value === 1) return imgRequestUrl(cover)
    return ''
})

watch(() => props.video.videoCover, () =>
{
    coverFailCount.value = 0
})

watch(coverSrc, () =>
{
    coverLoaded.value = false
})
</script>

<template>
    <div :class="['glass-video-card', { reordering, compact }]">
        <component :is="linkable ? RouterLink : 'div'" class="card-link" v-bind="linkAttrs">
            <span class="cover">
                <img v-if="coverSrc" :class="{ loaded: coverLoaded }" :src="coverSrc" alt="" loading="lazy"
                    draggable="false" @load="coverLoaded = true" @error="coverFailCount++">
                <span v-if="!compact" class="play-pill">{{ formatCount(video.playCount) }} 播放</span>
                <span v-if="hasDuration" class="duration">{{ formatDurationClock(video.duration) }}</span>
            </span>
            <span class="text">
                <span class="title" :title="titleText" v-html="titleHtml"></span>
                <span v-if="compact" class="meta">
                    {{ formatCount(video.playCount) }} 播放<template v-if="meta"> · {{ meta }}</template>
                </span>
                <span v-else class="meta">
                    {{ formatCount(video.danmakuCount) }} 弹幕<template v-if="meta"> · {{ meta }}</template>
                </span>
            </span>
        </component>
        <button v-if="removable" type="button" class="remove-button" :title="removeLabel" :aria-label="removeLabel"
            @click="emit('remove')">
            <TrashIcon />
        </button>
    </div>
</template>

<style lang="scss" scoped>
@use '@/pages/userHome/shared/styles/glass' as *;

.glass-video-card {
    position: relative;
    min-width: 0;
    border-radius: 24px;
    transition: background-color 0.25s, transform 0.25s, box-shadow 0.25s;

    &:hover {
        background: $glass-hover;
        transform: translateY(-2px);
    }

    // 排序中：浅白底 + 蓝色描边，按住拖动
    &.reordering {
        background: rgba(255, 255, 255, 0.4);
        box-shadow: inset 0 0 0 1.5px rgba(0, 0, 242, 0.35);
        cursor: grab;
    }
}

.card-link {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 8px 8px 14px;
    color: $warm-ink;
    text-decoration: none;
}

.cover {
    position: relative;
    display: block;
    aspect-ratio: 16 / 9;
    border-radius: 18px;
    overflow: hidden;
    isolation: isolate;
    background: $glass-placeholder;

    img {
        position: absolute;
        inset: 0;
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

// 左下角白雾胶囊：播放数
.play-pill {
    position: absolute;
    left: 8px;
    bottom: 8px;
    display: flex;
    align-items: center;
    max-width: calc(100% - 76px);
    height: 24px;
    padding: 0 10px;
    border-radius: 999px;
    overflow: hidden;
    white-space: nowrap;
    background: rgba(255, 255, 255, 0.55);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    color: $warm-ink;
    font-size: 11px;
    font-weight: 600;
}

.duration {
    position: absolute;
    right: 8px;
    bottom: 8px;
    display: flex;
    align-items: center;
    height: 24px;
    padding: 0 8px;
    border-radius: 999px;
    background: rgba(11, 12, 18, 0.62);
    color: #FFFFFF;
    font-size: 11px;
    font-weight: 500;
}

.text {
    display: flex;
    flex-direction: column;
    gap: 5px;
    min-width: 0;
    padding: 0 4px;
}

.title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.5;
    transition: color 0.2s;

    :deep(.highlight) {
        color: $warm-accent;
    }
}

.card-link:hover .title {
    color: $warm-accent;
}

.reordering .card-link:hover .title {
    color: inherit;
}

.meta {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    color: $warm-ink-3;
}

/*——————小号—————— */

.glass-video-card.compact {
    border-radius: 0;

    &:hover {
        background: transparent;
        transform: none;
    }

    .card-link {
        gap: 10px;
        padding: 0;
    }

    .cover {
        border-radius: 14px;
    }

    .duration {
        right: 6px;
        bottom: 6px;
        height: 20px;
        padding: 0 7px;
        font-size: 10px;
    }

    .text {
        gap: 3px;
        padding: 0;
    }

    .title {
        font-size: 13px;
        line-height: 1.4;
    }

    .meta {
        font-size: 11px;
    }
}

/*——————左上角删除：白雾圆 + 垃圾桶—————— */

.remove-button {
    @include reset-button;
    position: absolute;
    left: 16px;
    top: 16px;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.62);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
    transition: background-color 0.2s;

    &:hover {
        background: #FFFFFF;
    }
}
</style>

