<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import CcCheckChip from '@/pages/creativeCenter/shared/ui/CcCheckChip.vue';
import CcStatusPill from '@/pages/creativeCenter/shared/ui/CcStatusPill.vue';
import { videoFilterState } from '@/pages/creativeCenter/shared/lib/videoFilter';
import { formatBackendDateTime, formatDurationClock } from '@/shared/utils/DateUtil';
import { imgRequestUrl, resolveImageUrl } from '@/shared/utils/ImgUtil';
import { formatCount } from '@/shared/utils/NumberUtil';
import type { VideoUploadInfo } from '../model/VideoUploadInfo';
import {
    canEditVideo,
    hasInteractionFlag,
    InteractionFlag,
    VIDEO_STATUS_META,
    VideoStatus,
    type InteractionFlagValue,
} from '../model/videoWork';

const props = defineProps<{
    video: VideoUploadInfo,
}>()

const emit = defineEmits<{
    /** 未通过审核的稿件：打开预览弹窗 */
    (e: 'preview', video: VideoUploadInfo): void,
    (e: 'edit', video: VideoUploadInfo): void,
    (e: 'remove', video: VideoUploadInfo): void,
    (e: 'toggleInteraction', video: VideoUploadInfo, flag: InteractionFlagValue): void,
}>()

const isPassed = computed(() => props.video.status === VideoStatus.Passed)
const statusMeta = computed(() => props.video.status == null ? null : (VIDEO_STATUS_META[props.video.status] ?? null))
const canEdit = computed(() => canEditVideo(props.video))

const title = computed(() => props.video.videoName || '未命名稿件')
const videoPath = computed(() => `/video/${props.video.videoId}`)

/** 转码中的稿件还没有时长 */
const durationText = computed(() => props.video.duration ? formatDurationClock(props.video.duration) : '—')

const createTimeText = computed(() => formatBackendDateTime(props.video.createTime))
const updateTimeText = computed(() => formatBackendDateTime(props.video.lastUpdateTime))

/** 已通过的稿件才显示数据；没有值时显示 - */
const stats = computed(() =>
{
    const v = props.video
    return [
        { label: '播放', value: v.playCount },
        { label: '弹幕', value: v.danmakuCount },
        { label: '评论', value: v.commentCount },
        { label: '点赞', value: v.likeCount },
        { label: '投币', value: v.coinCount },
        { label: '收藏', value: v.collectCount },
    ].map(stat => ({ label: stat.label, value: stat.value === null ? '-' : formatCount(stat.value) }))
})

const danmakuClosed = computed(() => hasInteractionFlag(props.video.interaction, InteractionFlag.DanmakuClosed))
const commentClosed = computed(() => hasInteractionFlag(props.video.interaction, InteractionFlag.CommentClosed))

/** 跳到评论 / 弹幕管理，只看这个视频；标题和封面放在 history.state 里给筛选胶囊用 */
const filterState = computed(() => videoFilterState({
    videoName: props.video.videoName,
    videoCover: props.video.videoCover,
}))
const commentRoute = computed(() => ({
    name: 'videoCommentManagement',
    params: { videoId: props.video.videoId ?? '' },
    state: filterState.value,
}))
const danmakuRoute = computed(() => ({
    name: 'danmakuManagement',
    params: { videoId: props.video.videoId ?? '' },
    state: filterState.value,
}))

/**
 * 封面加载：
 * - 一律先试 public 缩略图（二次修改未换封面时常仍在公开桶）
 * - 未过审的稿件加载失败再回退 pending 预签名，只回退一次
 * - 都失败就显示灰色占位
 */
const coverSrc = ref('')
let coverFallbackTried = false
let coverRequestId = 0

watch(
    () => [props.video.videoCover, props.video.status] as const,
    ([cover]) =>
    {
        coverRequestId++
        coverFallbackTried = false
        coverSrc.value = cover ? imgRequestUrl(cover, true) : ''
    },
    { immediate: true },
)

async function onCoverError()
{
    const cover = props.video.videoCover
    if (!cover || isPassed.value || coverFallbackTried)
    {
        coverSrc.value = ''
        return
    }
    coverFallbackTried = true
    const requestId = coverRequestId
    const pendingUrl = await resolveImageUrl(cover, true)
    if (requestId !== coverRequestId) return
    coverSrc.value = pendingUrl
}
</script>

<template>
    <article class="work-row">
        <!-- 封面：已通过在新标签页打开视频，其余打开预览弹窗 -->
        <RouterLink v-if="isPassed" class="cover" :to="videoPath" target="_blank" :aria-label="`打开视频：${title}`">
            <img v-if="coverSrc" :src="coverSrc" alt="" loading="lazy" @error="onCoverError">
            <span class="duration">{{ durationText }}</span>
        </RouterLink>
        <button v-else type="button" class="cover" :aria-label="`预览：${title}`" @click="emit('preview', video)">
            <img v-if="coverSrc" :src="coverSrc" alt="" loading="lazy" @error="onCoverError">
            <span class="duration">{{ durationText }}</span>
        </button>

        <div class="work-main">
            <RouterLink v-if="isPassed" class="title" :to="videoPath" target="_blank" :title="title">{{ title }}</RouterLink>
            <button v-else type="button" class="title" :title="title" @click="emit('preview', video)">{{ title }}</button>

            <p class="meta">
                <span class="mono" title="投稿时间">{{ createTimeText }}</span>
                <template v-if="updateTimeText && updateTimeText !== createTimeText">
                    · 更新于 <span class="mono">{{ updateTimeText }}</span>
                </template>
            </p>

            <p v-if="isPassed" class="stats">
                <span v-for="stat in stats" :key="stat.label" class="stat">
                    {{ stat.label }}<span class="stat-value">{{ stat.value }}</span>
                </span>
            </p>
            <p v-else-if="statusMeta" :class="['status-hint', { danger: statusMeta.danger }]">{{ statusMeta.hint }}</p>

            <div class="actions">
                <CcCheckChip size="sm" label="关闭弹幕" :model-value="danmakuClosed" :disabled="!video.videoId"
                    @update:model-value="emit('toggleInteraction', video, InteractionFlag.DanmakuClosed)" />
                <CcCheckChip size="sm" label="关闭评论" :model-value="commentClosed" :disabled="!video.videoId"
                    @update:model-value="emit('toggleInteraction', video, InteractionFlag.CommentClosed)" />
                <template v-if="video.videoId">
                    <span class="divider" aria-hidden="true"></span>
                    <RouterLink class="link-pill" :to="commentRoute">评论管理 →</RouterLink>
                    <RouterLink class="link-pill" :to="danmakuRoute">弹幕管理 →</RouterLink>
                </template>
            </div>
        </div>

        <div class="work-side">
            <CcStatusPill v-if="statusMeta" :tone="statusMeta.tone" :label="statusMeta.label" />
            <div class="side-actions">
                <button v-if="canEdit" type="button" class="edit-pill" @click="emit('edit', video)">编辑</button>
                <button type="button" class="delete-pill" :disabled="!video.videoId"
                    @click="emit('remove', video)">删除</button>
            </div>
        </div>
    </article>
</template>

<style lang="scss" scoped>
@use '@/pages/creativeCenter/shared/styles/cc' as *;

.work-row {
    display: grid;
    grid-template-columns: 192px minmax(0, 1fr) auto;
    gap: 22px;
    align-items: center;
    padding: 16px 0;
    border-top: 1px solid $cc-line;
}

/*——————封面—————— */

.cover {
    @include reset-button;
    position: relative;
    display: block;
    width: 192px;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border-radius: 14px;
    background: linear-gradient(160deg, oklch(0.93 0.008 265), oklch(0.83 0.014 265));

    img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s;
    }

    &:hover img {
        transform: scale(1.04);
    }
}

.duration {
    position: absolute;
    right: 6px;
    bottom: 6px;
    display: flex;
    align-items: center;
    height: 20px;
    padding: 0 7px;
    border-radius: 999px;
    background: rgba(11, 12, 18, 0.62);
    color: #FFFFFF;
    font-size: 10px;
    font-weight: 500;
    line-height: 1;
}

/*——————中间：标题、时间、数据、操作—————— */

.work-main {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
}

.title {
    @include reset-button;
    display: block;
    max-width: 100%;
    align-self: flex-start;
    overflow: hidden;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 16px;
    font-weight: 700;
    line-height: 1.45;
    color: $warm-ink;
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
        color: $warm-accent;
    }
}

.meta {
    margin: 0;
    font-size: 12px;
    color: $warm-ink-4;

    .mono {
        @include mono(12px);
    }
}

.stats {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 18px;
    margin: 0;
    font-size: 13px;
    color: $warm-ink-3;

    .stat-value {
        margin-left: 6px;
        font-weight: 600;
        color: $warm-ink;
    }
}

.status-hint {
    margin: 0;
    font-size: 12px;
    color: $warm-ink-4;

    &.danger {
        color: $cc-danger;
    }
}

.actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
}

.divider {
    width: 1px;
    height: 18px;
    margin: 0 4px;
    background: #E3E5EB;
}

.link-pill {
    @include soft-pill;
    text-decoration: none;
}

/*——————右侧：状态 + 编辑 / 删除—————— */

.work-side {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 12px;
}

.side-actions {
    display: flex;
    gap: 8px;
}

.edit-pill {
    @include soft-pill;
}

.delete-pill {
    @include danger-pill;
}
</style>
