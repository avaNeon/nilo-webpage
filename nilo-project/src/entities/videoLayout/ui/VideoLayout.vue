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
    <div class="loading" v-if="isLoading">
        <img src="@/assets/loading-bar.gif" alt="Loading..." />
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
    > * {
        min-width: 0;
    }
}

.loading {
    padding: 100px 20px;
    width: 100%;

    img {
        display: block;
        margin: 0 auto;
        width: 10%;
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