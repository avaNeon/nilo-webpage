<script lang="ts" setup>
import type { VideoInfo } from '@/entities/model/VideoInfo';
import { calculateDuration, calculateRelativeTime } from '@/shared/utils/DateUtil';
import { imgRequestUrl } from '@/shared/utils/ImgUtil';
import { routerToNewPage } from '@/shared/utils/RouteUtil';

const props = withDefaults(defineProps<{
    videoInfo: VideoInfo,
    /**
     * vertical: 视频信息垂直排列，用于视频详情页右侧的相关推荐视频列表
     * horizontal: 视频信息水平排列，用于主页的每个视频项
     */
    type: 'vertical' | 'horizontal',
    /**
     * margin: 视频项的margin
     */
    margin?: string
}>(), {
    margin: '0'
})

</script>

<template>
    <div :class="['video', props.type]" :style="{
        margin: props.margin
    }">
        <RouterLink class="img-section" :to="`/video/${props.videoInfo.videoId}`"
            style="color: inherit; text-decoration: none;" target="_blank">
            <div class="cover">
                <img loading="lazy" :src="imgRequestUrl(props.videoInfo.videoCover)">
            </div>
            <div class="video-detail">
                <div class="count">
                    <div class="iconfont icon-play2">{{ props.videoInfo.playCount }}</div>
                    <div class="iconfont icon-danmu">{{ props.videoInfo.danmakuCount }}</div>
                </div>
                <div class="duration">{{ calculateDuration(props.videoInfo.duration) }}</div>
            </div>
        </RouterLink>
        <div class="video-info">
            <div class="video-name" @click="routerToNewPage(`/video/${props.videoInfo.videoId}`)">
                {{ props.videoInfo.videoName }}
            </div>
            <div class="other-info">
                <span class="author-name iconfont icon-upzhu"
                    @click="routerToNewPage(`/user/${props.videoInfo.briefUserInfo?.userId}`)">{{
                        props.videoInfo.briefUserInfo?.nickName }}</span>
                <span class="post-date"> · {{ calculateRelativeTime(props.videoInfo.lastUpdateTime) }}</span>
            </div>
        </div>
    </div>

</template>

<style lang="scss" scoped>
.video.horizontal {
    flex: 1 1 0;

    display: flex;
    flex-direction: column;
    justify-content: space-between;

    height: 100%;

    padding: 5px;
    border-radius: 5px;

    transition: all 0.2s ease;


    &:hover {
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.10), 0 2px 6px rgba(0, 0, 0, 0.06);
        transform: translateY(-4px);
    }

    .img-section {
        display: block;
        width: 100%;
        height: 75%;
        border-radius: 5px;
        cursor: pointer;

        position: relative;
        overflow: hidden;

        .cover {
            display: block;
            width: 100%;
            height: 100%;
            border-radius: 5px;


            /* 底部渐变覆盖层：从透明到半透明黑，位于图片之上 */
            &::after {
                content: '';
                position: absolute;
                left: 0;
                right: 0;
                bottom: 0;
                height: 20%;
                /* 覆盖底部 20% 高度 */
                background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.6) 100%);
                pointer-events: none;
            }

            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                object-position: center;
            }
        }

        .video-detail {
            width: 100%;
            padding: 5px 10px;

            color: white;
            font-size: 14px;

            position: absolute;
            bottom: 0;

            display: flex;
            justify-content: space-between;
            align-items: center;

            .count {
                display: flex;
                column-gap: 10px;

                .iconfont {
                    font-size: 14px;

                    &::first-letter {
                        margin-right: 3px;
                    }
                }
            }
        }

    }

    .video-info {
        .video-name {
            font-weight: 500;
            transition: all 0.2s ease;
            cursor: pointer;

            &:hover {
                color: #00AEEC;
            }
        }

        .other-info {
            height: 20px;
            line-height: 20px;

            .author-name {
                font-weight: 500;
                transition: all 0.2s ease;
                cursor: pointer;

                &:hover {
                    color: #00AEEC;
                }

                &::before {
                    margin-right: 2px;
                }
            }

            .author-name,
            .post-date {
                font-size: 14px;
                color: rgb(124, 123, 123);
            }
        }
    }
}

.video.vertical {
    flex: 1 1 0;

    display: flex;
    justify-content: space-between;

    height: 100%;

    padding: 5px;
    border-radius: 5px;

    transition: all 0.2s ease;


    &:hover {
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.10), 0 2px 6px rgba(0, 0, 0, 0.06);
        transform: translateY(-4px);
    }

    .img-section {
        display: block;
        width: 75%;
        height: 100%;
        border-radius: 5px;
        cursor: pointer;

        position: relative;
        overflow: hidden;

        .cover {
            display: block;
            width: 100%;
            height: 100%;
            border-radius: 5px;


            /* 底部渐变覆盖层：从透明到半透明黑，位于图片之上 */
            &::after {
                content: '';
                position: absolute;
                left: 0;
                right: 0;
                bottom: 0;
                height: 20%;
                /* 覆盖底部 20% 高度 */
                background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.6) 100%);
                pointer-events: none;
            }

            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                object-position: center;
            }
        }

        .video-detail {
            width: 100%;
            padding: 5px 10px;

            color: white;
            font-size: 14px;

            position: absolute;
            bottom: 0;

            display: flex;
            justify-content: space-between;
            align-items: center;

            .count {
                display: flex;
                column-gap: 10px;

                .iconfont {
                    font-size: 14px;

                    &::first-letter {
                        margin-right: 3px;
                    }
                }
            }
        }

    }

    .video-info {
        .video-name {
            font-weight: 500;
            transition: all 0.2s ease;
            cursor: pointer;

            &:hover {
                color: #00AEEC;
            }
        }

        .other-info {
            height: 20px;
            line-height: 20px;

            .author-name {
                font-size: 14px;
                color: rgb(124, 123, 123);

                font-weight: 500;
                transition: all 0.2s ease;
                cursor: pointer;

                &:hover {
                    color: #00AEEC;
                }

                &::before {
                    margin-right: 2px;
                }
            }

            .post-date {
                display: none;
            }
        }
    }
}
</style>
