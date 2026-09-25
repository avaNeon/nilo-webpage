<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { imgRequestUrl } from '@/shared/utils/ImgUtil';

const props = defineProps<{
    /** 视频标题；拿不到时显示「这个视频」 */
    title: string | null,
    /** 封面路径（后端返回的相对路径）；没有就显示灰色占位 */
    cover?: string | null,
    /** 只看某个分P时显示「P2」 */
    part?: number | null,
}>()

const emit = defineEmits<{
    /** 点 ×：回到全部视频 */
    (e: 'clear'): void,
}>()

const coverFailed = ref(false)
watch(() => props.cover, () => { coverFailed.value = false })

const coverSrc = computed(() => props.cover && !coverFailed.value ? imgRequestUrl(props.cover, true) : '')
const displayTitle = computed(() => props.title || '这个视频')
</script>

<template>
    <!-- 从稿件管理跳过来、只看某个视频时，标题行右边换成这个胶囊 -->
    <div class="cc-video-filter-chip">
        <span class="thumb">
            <img v-if="coverSrc" :src="coverSrc" alt="" @error="coverFailed = true">
        </span>
        <span class="text">
            <span class="label">仅看此视频<template v-if="part"> · P{{ part }}</template></span>
            <span class="title" :title="displayTitle">{{ displayTitle }}</span>
        </span>
        <button type="button" class="clear-button" title="查看全部" aria-label="查看全部视频" @click="emit('clear')">×</button>
    </div>
</template>

<style lang="scss" scoped>
@use '@/pages/creativeCenter/shared/styles/cc' as *;

.cc-video-filter-chip {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 320px;
    height: 46px;
    padding: 0 6px;
    border-radius: 999px;
    background: #FFFFFF;
    color: $warm-ink;
}

.thumb {
    flex-shrink: 0;
    width: 60px;
    height: 34px;
    overflow: hidden;
    border-radius: 999px;
    background: linear-gradient(160deg, oklch(0.93 0.008 265), oklch(0.83 0.014 265));

    img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
}

.text {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 1px;
    min-width: 0;

    .label {
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.06em;
        color: $warm-accent;
    }

    .title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 13px;
        font-weight: 600;
    }
}

.clear-button {
    @include reset-button;
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: $warm-sunken;
    color: $warm-ink-3;
    font-size: 16px;
    transition: background-color 0.2s, color 0.2s;

    &:hover {
        background: $warm-accent-soft;
        color: $warm-accent;
    }
}
</style>
