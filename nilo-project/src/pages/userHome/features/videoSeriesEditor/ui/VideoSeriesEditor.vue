<script lang="ts" setup>
import { computed, watch } from 'vue';
import { useVideoSeriesEditor } from '../model/useVideoSeriesEditor';
import message from '@/shared/lib/message';
import type { VideoInfo } from '@/shared/model/VideoInfo';
import { formatCount } from '@/shared/utils/NumberUtil';
import { formatDurationClock, formatRelativeDay } from '@/shared/utils/DateUtil';
import { imgRequestUrl } from '@/shared/utils/ImgUtil';
import GlassModal from '@/pages/userHome/shared/ui/GlassModal.vue';

const NAME_MAX = 100
const DESCRIPTION_MAX = 300

const props = defineProps<{
    visible: boolean;
    seriesId?: string;
    title?: string;
    description?: string;
    existedVideoList?: string[];
    maxVideosNumber?: number;
}>();

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: "submit", seriesId: string | undefined, seriesName: string,
        seriesDescription: string,
        videoIdList: string[],): void;
}>();

const {
    title,
    description,
    step,
    videoList,
    loadingVideos,
    allVideosLoaded,
    addedVideoList,
    seriesId,
    addedVideoLength,
    loadNextPageVideos,
    validateForm,
    clear,
    addVideo,
    removeVideo,
} = useVideoSeriesEditor()

const isEdit = computed(() => Boolean(seriesId.value))
const modalTitle = computed(() => isEdit.value ? '修改系列' : '新建系列')
const canNext = computed(() => title.value.trim().length > 0)
const maxVideos = computed(() => props.maxVideosNumber ?? 100)

/** 列表底部的提示 */
const loadHint = computed(() =>
{
    if (loadingVideos.value) return '加载中…'
    if (!allVideosLoaded.value) return '继续向下滚动，自动加载更多…'
    if (videoList.value.length === 0) return isEdit.value ? '所有视频都已经在这个系列里了' : '还没有可以添加的视频'
    return `已显示全部 ${videoList.value.length} 个视频`
})

function handleVideoItemsScroll(event: Event)
{
    const el = event.currentTarget as HTMLElement | null

    if (!el) return

    const bottomThreshold = 60
    const reachedBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - bottomThreshold

    if (reachedBottom)
    {
        loadNextPageVideos()
    }
}

function isSelected(videoId: string | null)
{
    return !!videoId && addedVideoList.value.includes(videoId)
}

function toggleVideo(videoId: string | null | undefined)
{
    if (!videoId) return

    if (!addedVideoList.value.includes(videoId))
    {
        if (addedVideoList.value.length >= maxVideos.value)
        {
            message.warning(`每个系列最多只能添加 ${maxVideos.value} 个视频`)
            return
        }
        addVideo(videoId)
        moveVideoToAddedArea(videoId)
    }
    else
    {
        removeVideo(videoId)
        addedVideoLength.value = Math.max(addedVideoLength.value - 1, 0)
    }
}

/** 勾选的视频挪到列表最前面 */
function moveVideoToAddedArea(videoId: string)
{
    const index = videoList.value.findIndex(video => video.videoId === videoId)

    if (index < 0) return

    const [selectedVideo] = videoList.value.splice(index, 1)
    videoList.value.splice(addedVideoLength.value, 0, selectedVideo as VideoInfo)
    addedVideoLength.value++
}

function handleSubmit()
{
    if (addedVideoList.value.length === 0)
    {
        message.warning("请至少选择一个视频")
        return;
    }
    emit('submit', seriesId.value, title.value.trim(), description.value, addedVideoList.value)
    emit('update:visible', false)
}

function handleNextStep()
{
    if (!canNext.value) return
    // 从第二步退回来再点「下一步」时列表已经有了，不再多加载一页
    if (videoList.value.length > 0)
    {
        step.value = 2
        return
    }
    validateForm()
}

function coverSrc(video: VideoInfo)
{
    return video.videoCover ? imgRequestUrl(video.videoCover, true) : ''
}

function plainTitle(video: VideoInfo)
{
    return (video.videoName ?? '').replace(/<[^>]*>/g, '')
}

/**
 * 处理传入的props
 */
function assemblePropsData()
{
    seriesId.value = props.seriesId
    title.value = props.title ?? ''
    description.value = props.description ?? ''
    addedVideoList.value = props.existedVideoList ? [...props.existedVideoList] : []
}

watch(
    () => [
        props.seriesId,
        props.title,
        props.description,
        props.existedVideoList,
        props.visible,
    ],
    assemblePropsData,
    { immediate: true },
)
</script>

<template>
    <GlassModal :visible="visible" :title="modalTitle" :width="620" @close="emit('update:visible', false)"
        @closed="clear">
        <template #title>
            <div class="modal-title">
                <span class="title-text">{{ modalTitle }}</span>
                <div class="steps">
                    <span :class="['step', { active: step === 1 }]">01 基本信息</span>
                    <span class="step-line" aria-hidden="true"></span>
                    <span :class="['step', { active: step === 2 }]">02 选择视频</span>
                </div>
            </div>
        </template>

        <template v-if="step === 1">
            <div class="form">
                <label class="field">
                    <span class="field-label">系列名称 <span class="required">*</span></span>
                    <span class="input-wrap">
                        <input v-model="title" :maxlength="NAME_MAX" placeholder="给系列起个名字" class="text-input"
                            @keyup.enter="handleNextStep">
                        <span class="counter">{{ title.length }} / {{ NAME_MAX }}</span>
                    </span>
                </label>
                <label class="field">
                    <span class="field-label">系列简介</span>
                    <span class="input-wrap">
                        <textarea v-model="description" :maxlength="DESCRIPTION_MAX" placeholder="简单介绍一下这个系列（选填）"
                            class="text-area"></textarea>
                        <span class="counter bottom">{{ description.length }} / {{ DESCRIPTION_MAX }}</span>
                    </span>
                </label>
            </div>
            <div class="actions">
                <button type="button" class="plain-button" @click="emit('update:visible', false)">取消</button>
                <button type="button" class="primary-button" :disabled="!canNext" @click="handleNextStep">下一步</button>
            </div>
        </template>

        <template v-else>
            <div class="pick-head">
                <span class="pick-hint">勾选要加入「<b>{{ title.trim() }}</b>」的视频</span>
                <span class="pick-count">已选 {{ addedVideoList.length }} / {{ maxVideos }}</span>
            </div>
            <div class="pick-list" @scroll="handleVideoItemsScroll">
                <button v-for="(video, index) in videoList" :key="video.videoId ?? index" type="button"
                    :class="['pick-row', { selected: isSelected(video.videoId) }]" role="checkbox"
                    :aria-checked="isSelected(video.videoId)" @click="toggleVideo(video.videoId)">
                    <span class="check-box" aria-hidden="true">{{ isSelected(video.videoId) ? '✓' : '' }}</span>
                    <span class="pick-cover">
                        <img v-if="coverSrc(video)" :src="coverSrc(video)" alt="" loading="lazy">
                        <span v-if="video.duration != null" class="pick-duration">
                            {{ formatDurationClock(video.duration) }}
                        </span>
                    </span>
                    <span class="pick-text">
                        <span class="pick-title" :title="plainTitle(video)">{{ plainTitle(video) }}</span>
                        <span class="pick-meta">
                            {{ formatCount(video.playCount) }} 播放 · {{ formatRelativeDay(video.lastUpdateTime ??
                                video.createTime) }}
                        </span>
                    </span>
                </button>
                <span class="load-hint">{{ loadHint }}</span>
            </div>
            <div class="actions split">
                <button type="button" class="plain-button" @click="step = 1">← 上一步</button>
                <div class="actions">
                    <button type="button" class="plain-button" @click="emit('update:visible', false)">取消</button>
                    <button type="button" class="primary-button" @click="handleSubmit">
                        {{ isEdit ? '保存修改' : '创建系列' }}
                    </button>
                </div>
            </div>
        </template>
    </GlassModal>
</template>

<style lang="scss" scoped>
@use '@/pages/userHome/shared/styles/glass' as *;

button {
    @include reset-button;
}

.modal-title {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .title-text {
        font-size: 22px;
        font-weight: 800;
        letter-spacing: -0.01em;
    }
}

// 步骤：当前步蓝底白字
.steps {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 600;

    .step {
        display: flex;
        align-items: center;
        height: 24px;
        padding: 0 10px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.8);
        color: $warm-ink-3;

        &.active {
            background: $warm-accent;
            color: #FFFFFF;
        }
    }

    .step-line {
        width: 16px;
        height: 1px;
        background: rgba(11, 12, 18, 0.2);
    }
}

/*——————第一步：名称 + 简介—————— */

.form {
    display: flex;
    flex-direction: column;
    gap: 18px;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .field-label {
        font-size: 13px;
        font-weight: 600;
    }

    .required {
        color: $warm-accent;
    }
}

.input-wrap {
    position: relative;
    display: block;
}

@mixin glass-input {
    width: 100%;
    border: 0;
    border-radius: 16px;
    outline: 0;
    background: rgba(255, 255, 255, 0.72);
    box-shadow: inset 0 1px 2px rgba(11, 12, 18, 0.08), inset 0 0 0 1px rgba(11, 12, 18, 0.1);
    color: $warm-ink;
    font: inherit;
    transition: box-shadow 0.2s, background-color 0.2s;

    &::placeholder {
        color: $warm-ink-4;
    }

    &:focus {
        background: #FFFFFF;
        box-shadow: inset 0 0 0 1.5px $warm-accent;
    }
}

.text-input {
    @include glass-input;
    height: 50px;
    padding: 0 84px 0 18px;
    font-size: 15px;
}

.text-area {
    @include glass-input;
    display: block;
    height: 120px;
    padding: 14px 18px 30px;
    font-size: 14px;
    line-height: 1.7;
    resize: none;
}

.counter {
    position: absolute;
    right: 16px;
    top: 16px;
    font-family: $warm-font-mono;
    font-size: 12px;
    color: $warm-ink-3;
    pointer-events: none;

    &.bottom {
        top: auto;
        bottom: 12px;
    }
}

/*——————按钮—————— */

.actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;

    &.split {
        justify-content: space-between;
    }
}

.plain-button {
    display: flex;
    align-items: center;
    height: 46px;
    padding: 0 24px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.8);
    font-size: 14px;
    font-weight: 500;
    transition: background-color 0.2s;

    &:hover {
        background: #FFFFFF;
    }
}

.primary-button {
    @include accent-button;
}

/*——————第二步：勾选视频—————— */

.pick-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    font-size: 13px;

    .pick-hint {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: $warm-ink-3;

        b {
            font-weight: 600;
            color: $warm-ink;
        }
    }

    .pick-count {
        flex-shrink: 0;
        font-weight: 600;
        color: $warm-accent;
    }
}

.pick-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    height: 420px;
    max-height: calc(100vh - 320px);
    margin: 0 -10px;
    padding: 0 10px;
    overflow: auto;
}

.pick-row {
    display: grid;
    flex-shrink: 0;
    grid-template-columns: 24px 128px minmax(0, 1fr);
    align-items: center;
    gap: 14px;
    padding: 8px 12px 8px 10px;
    border-radius: 18px;
    text-align: left;
    transition: background-color 0.15s;

    &:hover {
        background: rgba(255, 255, 255, 0.7);
    }

    &.selected {
        background: rgba(0, 0, 242, 0.08);
    }
}

.check-box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 7px;
    background: #FFFFFF;
    box-shadow: inset 0 0 0 1.5px rgba(11, 12, 18, 0.25);
    color: #FFFFFF;
    font-size: 13px;
    font-weight: 700;

    .selected & {
        background: $warm-accent;
        box-shadow: none;
    }
}

.pick-cover {
    position: relative;
    aspect-ratio: 16 / 9;
    border-radius: 12px;
    overflow: hidden;
    background: $glass-placeholder;

    img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .pick-duration {
        position: absolute;
        right: 5px;
        bottom: 5px;
        display: flex;
        align-items: center;
        height: 18px;
        padding: 0 6px;
        border-radius: 999px;
        background: rgba(11, 12, 18, 0.62);
        color: #FFFFFF;
        font-size: 10px;
        font-weight: 500;
    }
}

.pick-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;

    .pick-title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 14px;
        font-weight: 600;
    }

    .pick-meta {
        font-size: 12px;
        color: $warm-ink-3;
    }
}

.load-hint {
    flex-shrink: 0;
    padding: 14px 0 6px;
    text-align: center;
    font-size: 12px;
    color: $warm-ink-3;
}
</style>
