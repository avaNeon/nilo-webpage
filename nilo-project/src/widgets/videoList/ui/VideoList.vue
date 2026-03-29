<script setup lang="ts">
import { onMounted } from 'vue';
import VideoItem from '@/entities/ui/VideoItem.vue';
import { imgRequestUrl } from '@/shared/utils/ImgUtil';
import { useVideo } from '../model/useVideo';
import { useCarousel } from '../model/useCarousel';

const { carouselVideoList, recommendVideoList, loadRecommendVideos } = useVideo()
const { carouselIndex, carouselChange, prevCarousel, nextCarousel, setCarousel } = useCarousel()

onMounted(() => {
    loadRecommendVideos()
})

</script>

<template>
    <div class="recommend-panel">
        <div class="carousel-panel">
            <el-carousel class="index-carousel" height="100%" indicator-position="none" arrow="never"
                @change="carouselChange" ref="carouselRef">
                <el-carousel-item v-for="(item, index) in carouselVideoList" :key="index">
                    <div class="rolling-image">
                        <div class="router-link">
                            <img class="cover" :src="imgRequestUrl(item.videoCover)" :alt="item.videoName ?? ''" />
                        </div>
                    </div>
                </el-carousel-item>
            </el-carousel>
            <div class="label">
                <div class="left-part">
                    <RouterLink class="label-name" :to="`/video/${carouselVideoList[carouselIndex]?.videoId}`"
                        target="_blank">
                        {{ carouselVideoList[carouselIndex]?.videoName }}
                    </RouterLink>
                    <div class="dots">
                        <div :class="['dot', carouselIndex == index - 1 ? 'active' : '']"
                            v-for="index in carouselVideoList.length" @click="setCarousel(index)"></div>
                    </div>
                </div>
                <div class="button">
                    <span class="iconfont icon-left" @click="prevCarousel"></span>
                    <span class="iconfont icon-right" @click="nextCarousel"></span>
                </div>
            </div>
        </div>
        <div class="recommend-video-panel">
            <div class="video-item" v-for="(recommendVideo, index) in recommendVideoList" :key="index">
                <VideoItem :videoInfo="recommendVideo" type="horizontal"></VideoItem>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
$grid-gap: 12px;
$recommend-item-h: 204px;

.recommend-panel {
    padding-top: 10px;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: $grid-gap;

    min-width: 1200px;

    .carousel-panel {
        grid-column: span 2;
        // 两行卡片高度 + 一条行间隙，保证左右视觉等高
        height: calc(#{$recommend-item-h} * 2 + #{$grid-gap});
        position: relative;
        overflow: hidden;
        border-radius: 6px;

        .index-carousel {
            height: 100%;
        }

        .rolling-image {
            width: 100%;
            height: 100%;

            .router-link {
                display: block;
                width: 100%;
                height: 100%;

                .cover {
                    display: block;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    object-position: center;
                }
            }
        }

        .label {
            // 位置及尺寸
            position: absolute;
            bottom: 0px;
            width: 100%;
            height: 80px;
            background-color: rgba(0, 0, 0, 0.4);
            padding: 10px 20px 10px;

            // 子元素位置
            display: flex;
            justify-content: space-between;
            align-items: center;

            .left-part {
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                row-gap: 10px;

                .label-name {
                    // 字体
                    color: white;
                    text-decoration: none;
                    font-size: 20px;
                    font-weight: 500;

                    &:hover {
                        color: #00AEEC;
                    }
                }

                .dots {
                    display: flex;
                    column-gap: 10px;

                    .dot {
                        width: 10px;
                        height: 10px;
                        border-radius: 50%;
                        background-color: rgba(255, 255, 255, 0.5);
                        cursor: pointer;
                        transition: all 0.2s ease;

                        &.active {
                            transform: scale(1.5);
                            background-color: white;
                        }
                    }
                }
            }

            .button {
                width: 80px;

                color: white;

                display: flex;
                justify-content: space-around;

                cursor: pointer;

                .iconfont {
                    width: 30px;
                    height: 30px;

                    line-height: 30px;
                    text-align: center;
                    font-size: 20px;
                    background-color: rgba(0, 0, 0, 0.4);
                    border-radius: 5px;

                    transition: all 0.1s ease;

                    &:active {
                        transform: scale(0.8);
                    }
                }
            }

        }
    }

    .recommend-video-panel {
        grid-column: span 3;

        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        grid-template-rows: repeat(2, $recommend-item-h);
        gap: $grid-gap;

        .video-item {
            height: 100%;
            display: block;
        }
    }

}


.el-carousel__item h3 {
    color: #475669;
    opacity: 0.75;
    line-height: 200px;
    margin: 0;
    text-align: center;
}

.el-carousel__item:nth-child(2n) {
    background-color: #99a9bf;
}

.el-carousel__item:nth-child(2n + 1) {
    background-color: #d3dce6;
}
</style>

<style lang="scss"></style>
