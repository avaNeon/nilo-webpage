<script lang="ts" setup>
import { imgRequestUrl } from '@/shared/utils/ImgUtil';
import type { VideoSeriesInfo } from '../model/VideoSeriesInfo';
import questSrc from '@/assets/quest.svg'
import { computed, ref } from 'vue';

const props = withDefaults(defineProps<{
    videoSeriesInfo: VideoSeriesInfo,
}>(), {})

const defaultImg = ref(false);

const imgSrc = computed(() =>
{
    const src = imgRequestUrl(props.videoSeriesInfo.videoCover)
    if (!src)
    {
        defaultImg.value = true;
        return questSrc;
    }
    else
    {
        return src;
    }
})
</script>

<template>
    <div class="serie-item-content">
        <div class="serie-cover">
            <img :class="[defaultImg ? 'default-img' : '']" loading="lazy" :src="imgSrc" alt="cover">
        </div>
        <div class="serie-info">
            <div class="serie-main-info">
                <div class="serie-name-text">{{ videoSeriesInfo.seriesName }}</div>
                <div class="count">({{ videoSeriesInfo.videoCount }})</div>
            </div>
            <div class="serie-bottom-info">
                <div class="serie-update-date">更新于：{{ videoSeriesInfo.updateTime }}</div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.serie-item-content {
    display: flex;
    flex-direction: column;
    column-gap: 10px;
    border-radius: 15px;

    .serie-cover {
        height: 70%;
        width: 100%;
        cursor: pointer;

        img {
            width: 100%;
            height: 100%;
            border-radius: 15px;
            object-fit: cover;
            object-position: center;
        }

        .default-img {
            width: 100%;
            height: 100%;
            border-radius: 15px;
            object-fit: contain;
            object-position: center;
        }
    }

    .serie-info {
        height: 28%;

        display: flex;
        flex-direction: column;
        justify-content: space-between;
        row-gap: 5px;

        padding: 10px 10px 5px;

        .serie-main-info {
            display: flex;
            column-gap: 4px;
            align-items: center;

            font-size: 16px;

            .serie-name-text {
                cursor: pointer;

                font-weight: 500;
                text-wrap: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                color: $color-text-primary;

                transition: color 0.2s ease;

                &:hover {
                    color: $color-bilibili-blue;
                }
            }
        }

        .serie-bottom-info {
            font-size: 12px;
            color: $color-text-secondary;

            .serie-update-date {
                text-wrap: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        }
    }
}
</style>