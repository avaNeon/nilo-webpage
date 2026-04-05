<script lang="ts" setup>
import type { VideoInfo } from '@/shared/model/VideoInfo';
import { calculateDuration, calculateRelativeTime } from '@/shared/utils/DateUtil';
import { imgRequestUrl } from '@/shared/utils/ImgUtil';
import { routerToNewPage } from '@/shared/utils/RouteUtil';
import { useVideoItemRipple } from '../model/useVideoItemRipple';

const { getRippleStyle } = useVideoItemRipple()

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
        margin: props.margin,
        ...getRippleStyle(props.videoInfo),
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
                <span :title="props.videoInfo.videoName || ''">
                    {{ props.videoInfo.videoName }}
                </span>
            </div>
            <div class="other-info"
                :title="`${props.videoInfo.briefUserInfo?.nickName} · ${calculateRelativeTime(props.videoInfo.lastUpdateTime)}`">
                <span class="author-name iconfont icon-upzhu"
                    @click="routerToNewPage(`/user/${props.videoInfo.briefUserInfo?.userId}`)">{{
                        props.videoInfo.briefUserInfo?.nickName }}</span>
                <span class="post-date"> · {{ calculateRelativeTime(props.videoInfo.lastUpdateTime) }}</span>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
/* ─── 共用 ripple 伪元素 ─────────────────────────────────────────── */
%ripple-base {
    position: relative;
    overflow: hidden;
    isolation: isolate;

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        pointer-events: none;
        z-index: 0;
        background-color: var(--ripple-color, #A29BFE);

        /* 离开时：scale 缩回 0，先慢后快（ease-in） */
        transform: scale(0);
        opacity: 0;
        transition:
            transform 0.4s cubic-bezier(0, .82, .68, 1),
            opacity 0.4s ease;
    }

    &:hover::before {
        /* 进入时：scale 扩展到 1，先快后慢（ease-out），颜色速出 */
        transform: scale(1);
        opacity: 0.25;
        transition:
            transform 0.4s cubic-bezier(0, .82, .68, 1),
            opacity 0.4s ease;
    }
}

/* ─── horizontal ────────────────────────────────────────────────── */
.video.horizontal {
    @extend %ripple-base;

    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    padding: 10px;
    border-radius: 5px;
    transition: box-shadow 0.2s ease, transform 0.2s ease;

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
        z-index: 1;

        .cover {
            display: block;
            width: 100%;
            height: 100%;
            border-radius: 5px;

            &::after {
                content: '';
                position: absolute;
                left: 0;
                right: 0;
                bottom: 0;
                height: 20%;
                background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, $color-mask-60 100%);
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
        height: 25%;
        display: flex;
        flex-direction: column;
        justify-content: end;
        z-index: 1;

        .video-name {
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s ease;
            cursor: pointer;
            text-wrap: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;

            &:hover {
                font-size: 16px;
            }
        }

        .other-info {
            height: 20px;
            line-height: 20px;
            text-wrap: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;

            .author-name {
                font-weight: 500;
                transition: all 0.2s ease;
                cursor: pointer;

                &:hover {
                    font-size: 16px;
                }

                &::before {
                    margin-right: 2px;
                }
            }

            .author-name,
            .post-date {
                font-size: 14px;
                color: $color-text-muted;
            }
        }
    }
}

/* ─── vertical ──────────────────────────────────────────────────── */
.video.vertical {
    @extend %ripple-base;

    flex: 1 1 0;
    display: flex;
    justify-content: space-between;
    height: 100%;
    padding: 5px;
    border-radius: 5px;
    transition: box-shadow 0.2s ease, transform 0.2s ease;

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
        z-index: 1;

        .cover {
            display: block;
            width: 100%;
            height: 100%;
            border-radius: 5px;

            &::after {
                content: '';
                position: absolute;
                left: 0;
                right: 0;
                bottom: 0;
                height: 20%;
                background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, $color-mask-60 100%);
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
        z-index: 1;

        .video-name {
            font-weight: 500;
            transition: all 0.2s ease;
            cursor: pointer;

            &:hover {
                color: $color-bilibili-blue;
            }
        }

        .other-info {
            height: 20px;
            line-height: 20px;

            .author-name {
                font-size: 14px;
                color: $color-text-muted;
                font-weight: 500;
                transition: all 0.2s ease;
                cursor: pointer;

                &:hover {
                    color: $color-bilibili-blue;
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
