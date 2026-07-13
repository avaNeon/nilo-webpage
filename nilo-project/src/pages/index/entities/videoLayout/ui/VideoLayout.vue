<script lang="ts" setup>
import type { VideoList } from '@/shared/model/VideoList';
import { inject } from 'vue';

const props = withDefaults(defineProps<{
    /** 底部提示信息 */
    bottomMsg?: string,
    /** 布局类型 */
    layoutType?: 'grid',
    /** 每行视频数量 */
    rowItemCount?: number,
}>(), {
    bottomMsg: '我是有底线的',
    layoutType: 'grid',
    rowItemCount: 5,
})

const videoList = inject<VideoList | undefined>('videoList')
const isLoading = inject<boolean>('isLoading') || false

</script>

<template>
    <div :class="[
        props.layoutType == 'grid' ? 'grid-layout' : '',

    ]" :style="{
        'grid-template-columns': props.layoutType == 'grid' ? `repeat(${props.rowItemCount},1fr)` : '',

    }">
        <template v-for="videoItem in videoList?.list">
            <slot class="video-item" :videoInfo="videoItem"></slot>
        </template>
    </div>
    <div class="loading" v-if="isLoading" role="status" aria-live="polite" aria-label="视频加载中">
        <div class="loading-bar">
            <div class="loading-bar__track">
                <div class="loading-bar__indicator" />
            </div>
            <span class="loading-bar__text">加载中</span>
        </div>
    </div>
    <div class="bottom"
        v-if="videoList && !isLoading && videoList.list.length > 0 && videoList?.pageNo >= videoList?.pageTotal">
        —————— {{ bottomMsg }} ——————
    </div>
</template>

<style lang="scss" scoped>
.grid-layout {
    display: grid;
    gap: $video-item-gap;

    // 防止视频子内容宽度限制不能平分空间
    >* {
        min-width: 0;
    }
}

.loading {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    padding: 48px 20px 56px;
}

.loading-bar {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    width: min(220px, 42vw);

    &__track {
        position: relative;
        width: 100%;
        height: 3px;
        overflow: hidden;
        border-radius: 999px;
        background: rgba($color-bilibili-blue, 0.14);
    }

    &__indicator {
        position: absolute;
        top: 0;
        left: 0;
        width: 40%;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg,
                rgba($color-bilibili-blue, 0.35),
                $color-bilibili-blue,
                rgba($color-bilibili-blue, 0.35));
        animation: loading-slide 1.15s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }

    &__text {
        font-size: 13px;
        font-weight: 500;
        letter-spacing: 0.08em;
        color: $color-text-muted;
    }
}

@keyframes loading-slide {
    0% {
        transform: translateX(-120%);
    }

    100% {
        transform: translateX(320%);
    }
}

.bottom {
    text-align: center;
    height: 100px;
    line-height: 100px;
    font-size: 14px;
    font-weight: 500;
    color: $color-text-muted;
}
</style>
