<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { imgRequestUrl } from '@/shared/utils/ImgUtil';
import { formatBackendDateTime } from '@/shared/utils/DateUtil';
import type { VideoSeriesInfo } from '../model/VideoSeriesInfo';
import TrashIcon from './TrashIcon.vue';

const props = withDefaults(defineProps<{
    videoSeriesInfo: VideoSeriesInfo,
    /** 左上角显示删除按钮 */
    removable?: boolean,
    /** 排序中：蓝色描边、可拖动 */
    reordering?: boolean,
}>(), {
    removable: false,
    reordering: false,
})

const emit = defineEmits<{
    (e: 'remove'): void,
}>()

/*——————封面：第一个视频的封面，先取缩略图，失败退回原图，再失败露出底色—————— */

const coverFailCount = ref(0)

const coverSrc = computed(() =>
{
    const cover = props.videoSeriesInfo.videoCover
    if (!cover) return ''
    if (coverFailCount.value === 0) return imgRequestUrl(cover, true)
    if (coverFailCount.value === 1) return imgRequestUrl(cover)
    return ''
})

watch(() => props.videoSeriesInfo.videoCover, () =>
{
    coverFailCount.value = 0
})

const updatedText = computed(() => formatBackendDateTime(props.videoSeriesInfo.updateTime))
</script>

<template>
    <!-- 文件夹样式：封面后面叠两层白卡片 -->
    <div :class="['serie-item', { reordering }]">
        <div class="serie-stack">
            <span class="stack-layer back" aria-hidden="true"></span>
            <span class="stack-layer middle" aria-hidden="true"></span>
            <div :class="['serie-cover', { empty: !coverSrc }]">
                <img v-if="coverSrc" :src="coverSrc" alt="" loading="lazy" draggable="false"
                    @error="coverFailCount++">
                <span class="video-count">{{ videoSeriesInfo.videoCount }} 个视频</span>
            </div>
            <button v-if="removable" type="button" class="remove-button" title="删除系列" aria-label="删除系列"
                @click.prevent.stop="emit('remove')">
                <TrashIcon />
            </button>
        </div>
        <div class="serie-info">
            <span class="serie-name" :title="videoSeriesInfo.seriesName ?? ''">{{ videoSeriesInfo.seriesName }}</span>
            <span v-if="updatedText" class="serie-updated">更新于 <span class="mono">{{ updatedText }}</span></span>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@use '@/pages/userHome/shared/styles/glass' as *;

.serie-item {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
    padding: 14px 8px;
    border-radius: 24px;
    color: $warm-ink;
    transition: background-color 0.25s, transform 0.25s, box-shadow 0.25s;

    &:hover {
        background: $glass-hover;
        transform: translateY(-2px);
    }

    &.reordering {
        background: rgba(255, 255, 255, 0.4);
        box-shadow: inset 0 0 0 1.5px rgba(0, 0, 242, 0.35);
        cursor: grab;
    }
}

.serie-stack {
    position: relative;
    aspect-ratio: 16 / 10;
}

.stack-layer {
    position: absolute;
    height: 40px;

    &.back {
        left: 12%;
        right: 12%;
        top: -8px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.5);
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.6);
    }

    &.middle {
        left: 6%;
        right: 6%;
        top: -4px;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.7);
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.7);
    }
}

.serie-cover {
    position: absolute;
    inset: 0;
    border-radius: 18px;
    overflow: hidden;
    background: $glass-placeholder;
    box-shadow: 0 10px 24px -14px rgba(11, 12, 18, 0.45);

    // 空系列：半透明白
    &.empty {
        background: rgba(255, 255, 255, 0.5);
    }

    img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .video-count {
        position: absolute;
        right: 8px;
        bottom: 8px;
        display: flex;
        align-items: center;
        height: 24px;
        padding: 0 10px;
        border-radius: 999px;
        background: rgba(11, 12, 18, 0.62);
        color: #FFFFFF;
        font-size: 11px;
        font-weight: 600;
    }
}

.remove-button {
    @include reset-button;
    position: absolute;
    left: 8px;
    top: 8px;
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

.serie-info {
    display: flex;
    flex-direction: column;
    gap: 5px;
    min-width: 0;
    padding: 0 4px;
}

.serie-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 15px;
    font-weight: 700;
    transition: color 0.2s;
}

.serie-item:not(.reordering):hover .serie-name {
    color: $warm-accent;
}

.serie-updated {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    color: $warm-ink-3;

    .mono {
        font-family: $warm-font-mono;
    }
}
</style>
