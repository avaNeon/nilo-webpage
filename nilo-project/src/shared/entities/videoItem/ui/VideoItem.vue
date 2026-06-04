<script lang="ts" setup>
import type { VideoInfo } from '@/shared/model/VideoInfo';
import { calculateDuration, calculateRelativeTime } from '@/shared/utils/DateUtil';
import { imgRequestUrl } from '@/shared/utils/ImgUtil';
import { routerToNewPage } from '@/shared/utils/RouteUtil';
import { useVideoItemRipple } from '../model/useVideoItemRipple';
import option from '@/assets/icon/img/options-horizontal.svg'
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

const { getRippleStyle } = useVideoItemRipple()

const router = useRouter()

const VideoStatusEnum = {
    Transcoding: 0,
    TranscodingFailed: 1,
    PendingReview: 2,
    Passed: 3,
    NotPassed: 4,
}

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
    margin?: string,
    /**
     * when viewing videos in video management panel, this will be true
     */
    authorMode?: boolean,
    reviewState?: 0 | 1 | 2 | 3 | 4 | null,
    width?: string,
}>(), {
    margin: '0',
    authorMode: false,
    width: '20%',
})

const emit = defineEmits<{
    (e: 'edit', videoInfo: VideoInfo): void;
    (e: 'toggleDanmaku', videoInfo: VideoInfo): void;
    (e: 'toggleComment', videoInfo: VideoInfo): void;
    (e: 'deleteVideo', videoInfo: VideoInfo): void;
}>()

const canEdit = computed(() =>
    (props.reviewState === VideoStatusEnum.Passed || props.reviewState === VideoStatusEnum.NotPassed || props.reviewState === VideoStatusEnum.TranscodingFailed) && !!props.videoInfo.videoId,
)

const imgSectionStyle = computed(() =>
    props.type === 'vertical'
        ? { width: props.width }
        : undefined,
)

function onEditClick()
{
    if (!canEdit.value || !props.videoInfo.videoId) return
    emit('edit', props.videoInfo)
}

/* ─── options panel ─────────────────────────────────────────── */

const showOptionsPanel = ref(false)

/** local checkbox states, initialised from props.interaction on mount */
const closeDanmaku = ref((props.videoInfo.interaction ?? '').split(',').includes('0'))
const closeComment = ref((props.videoInfo.interaction ?? '').split(',').includes('1'))

/** 0.5s cooldown flag to prevent rapid clicks */
const danmakuCooldown = ref(false)
const commentCooldown = ref(false)

function onToggleDanmaku()
{
    if (!props.videoInfo.videoId || danmakuCooldown.value) return
    emit('toggleDanmaku', props.videoInfo)
    danmakuCooldown.value = true
    setTimeout(() => { danmakuCooldown.value = false }, 500)
}

function onToggleComment()
{
    if (!props.videoInfo.videoId || commentCooldown.value) return
    emit('toggleComment', props.videoInfo)
    commentCooldown.value = true
    setTimeout(() => { commentCooldown.value = false }, 500)
}

function onDeleteVideo()
{
    if (!props.videoInfo.videoId) return
    emit('deleteVideo', props.videoInfo)
}

function toggleOptionsPanel()
{
    showOptionsPanel.value = !showOptionsPanel.value
}

</script>

<template>
    <div :class="['video', props.type, { 'author-mode': props.authorMode }]" :style="{
        margin: props.margin,
        zIndex: showOptionsPanel ? 100 : undefined,
        ...(props.authorMode ? {} : getRippleStyle(props.videoInfo)),
    }">
        <RouterLink class="img-section" :style="[{ color: 'inherit', textDecoration: 'none' }, imgSectionStyle]"
            :to="`/video/${props.videoInfo.videoId}`" target="_blank">
            <div class="cover">
                <img loading="lazy" :src="imgRequestUrl(props.videoInfo.videoCover)">
            </div>
            <div class="video-detail">
                <div v-if="type === 'horizontal'" class="count">
                    <div class="iconfont icon-play2">{{ props.videoInfo.playCount }}</div>
                    <div class="iconfont icon-danmu">{{ props.videoInfo.danmakuCount }}</div>
                </div>
                <div class="duration">{{ calculateDuration(props.videoInfo.duration) }}</div>
            </div>
        </RouterLink>
        <div class="video-info">
            <div class="top-info">
                <div class="video-name" @click="routerToNewPage(`/video/${props.videoInfo.videoId}`)">
                    <span :title="props.videoInfo.videoName || ''">
                        {{ props.videoInfo.videoName }}
                    </span>
                </div>
                <div v-if="authorMode && reviewState !== null" class="review-state">
                    <span class="state-item transcoding" v-if="reviewState === VideoStatusEnum.Transcoding">转码中</span>
                    <span class="state-item transcoding-failed"
                        v-else-if="reviewState === VideoStatusEnum.TranscodingFailed">转码失败</span>
                    <span class="state-item pending-review"
                        v-else-if="reviewState === VideoStatusEnum.PendingReview">待审核</span>
                    <span class="state-item passed" v-else-if="reviewState === VideoStatusEnum.Passed">已通过</span>
                    <span class="state-item not-passed" v-else-if="reviewState === VideoStatusEnum.NotPassed">未通过</span>
                </div>
                <div v-if="authorMode && reviewState !== null" class="extra-info">
                    <span v-if="reviewState === VideoStatusEnum.TranscodingFailed" class="info-text">请重新上传转码失败的文件</span>
                    <span v-if="reviewState === VideoStatusEnum.NotPassed" class="info-text">请修改后重新上传</span>
                </div>
            </div>
            <div v-if="!authorMode" :class="['other-info', type === 'vertical' ? 'vertical' : '']"
                :title="`${props.videoInfo.briefUserInfo?.nickName + ' · '}${calculateRelativeTime(props.videoInfo.lastUpdateTime)}`">
                <span class="author-name iconfont icon-upzhu"
                    @click="routerToNewPage(`/user/${props.videoInfo.briefUserInfo?.userId}`)">{{
                        props.videoInfo.briefUserInfo?.nickName }}</span>
                <span v-if="type === 'horizontal'"> · </span>
                <div v-if="type === 'vertical'" class="count">
                    <div class="iconfont icon-play2" title="播放数">{{ props.videoInfo.playCount }}</div>
                    <div class="iconfont icon-danmu" title="弹幕数">{{ props.videoInfo.danmakuCount }}</div>
                </div>
                <span v-if="type === 'horizontal'" class="post-date">
                    {{ calculateRelativeTime(props.videoInfo.lastUpdateTime) }}
                </span>
            </div>
            <div v-else class="other-info">
                <div class="left">
                    <div class="count">
                        <div class="iconfont icon-play2" title="播放数">{{ props.videoInfo.playCount === undefined ||
                            props.videoInfo.playCount === null ? "-" : props.videoInfo.playCount }}</div>
                        <div class="iconfont icon-danmu" title="弹幕数">{{ props.videoInfo.danmakuCount === undefined ||
                            props.videoInfo.danmakuCount === null ? "-" : props.videoInfo.danmakuCount }}</div>
                        <div class="iconfont icon-Chat-1" title="评论数">{{ props.videoInfo.commentCount === undefined ||
                            props.videoInfo.commentCount === null ? "-" : props.videoInfo.commentCount }}</div>
                        <div class="iconfont icon-like-solid" title="点赞数">{{ props.videoInfo.likeCount === undefined ||
                            props.videoInfo.likeCount === null ? "-" : props.videoInfo.likeCount }}</div>
                        <div class="iconfont icon-toubi" title="投币数">{{ props.videoInfo.coinCount === undefined ||
                            props.videoInfo.coinCount === null ? "-" : props.videoInfo.coinCount }}</div>
                        <div class="iconfont icon-collection-solid" title="收藏数">{{ props.videoInfo.collectCount ===
                            undefined || props.videoInfo.collectCount === null ? "-" : props.videoInfo.collectCount }}
                        </div>
                    </div>
                    <div class="post-date">
                        <span class="create-time">创建时间：{{ props.videoInfo.createTime }}</span>
                        <span class="last-update-time">最后更新时间：{{ props.videoInfo.lastUpdateTime }}</span>
                    </div>
                </div>
                <div v-if="authorMode" class="right">
                    <el-button class="edit" type="plain" :disabled="!canEdit" @click="onEditClick">编辑</el-button>
                    <div class="options" @click="toggleOptionsPanel">
                        <img :src="option">
                        <div v-if="showOptionsPanel" class="options-panel" @click.stop>
                            <!-- 上部分：弹幕管理 & 评论管理 -->
                            <div class="panel-top">
                                <div class="panel-top-item" @click="router.push(`/cc/danmaku/${videoInfo.videoId}`)">
                                    <span class="iconfont icon-danmu"></span>
                                    <span class="panel-item-text">弹幕管理</span>
                                </div>
                                <div class="panel-top-item" @click="router.push(`/cc/comment/${videoInfo.videoId}`)">
                                    <span class="iconfont icon-Chat-1"></span>
                                    <span class="panel-item-text">评论管理</span>
                                </div>
                            </div>
                            <div class="panel-divider"></div>
                            <!-- 中部分：checkbox -->
                            <div class="panel-middle">
                                <el-checkbox v-model="closeDanmaku" @change="onToggleDanmaku">关闭弹幕</el-checkbox>
                                <el-checkbox v-model="closeComment" @change="onToggleComment">关闭评论</el-checkbox>
                            </div>
                            <div class="panel-divider"></div>
                            <!-- 下部分：删除稿件按钮 -->
                            <div class="panel-bottom">
                                <el-button class="delete-btn" type="danger" @click="onDeleteVideo">
                                    <span class="iconfont icon-delete"></span>
                                    <span>删除稿件</span>
                                </el-button>
                            </div>
                        </div>
                    </div>
                </div>
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
    height: 100%;
    border-radius: 15px;
    transition: box-shadow 0.2s ease;

    &:hover {
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.10), 0 2px 6px rgba(0, 0, 0, 0.06);
    }

    .img-section {
        display: block;
        width: 100%;
        height: 70%;
        border-radius: 15px;
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
        height: 30%;
        display: flex;
        flex-direction: column;
        justify-content: end;
        z-index: 1;
        padding: 0 10px 10px;

        .video-name {
            margin: 7px 0 0;

            font-size: 15px;
            font-weight: 500;
            transition: color 0.3s ease;
            cursor: pointer;
            text-wrap: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;

            &:hover {
                color: $color-bilibili-blue;
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
                transition: color 0.2s ease;
                cursor: pointer;

                &:hover {
                    color: $color-bilibili-blue;
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

    &.author-mode {
        overflow: visible;
        isolation: auto;
    }

    display: flex;
    justify-content: start;
    column-gap: 20px;
    height: 100%;
    padding: 5px;
    border-radius: 5px;
    transition: box-shadow 0.2s ease,
    transform 0.2s ease;

    &:hover {
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.10), 0 2px 6px rgba(0, 0, 0, 0.06);
        transform: translateY(-4px);
    }

    .img-section {
        display: block;
        flex-shrink: 0;
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
            justify-content: end;

            .duration {
                padding: 3px 5px;
                background-color: $color-mask-30;
                border-radius: 7px;
            }
        }
    }

    .video-info {
        flex: 1 1 0;
        min-width: 0;
        z-index: 1;

        .top-info {
            display: flex;
            column-gap: 10px;
            align-items: center;
            min-width: 0;

            .video-name {
                flex: 1 1 auto;
                min-width: 0;
                font-size: 18px;
                transition: all 0.2s ease;
                cursor: pointer;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;

                >div,
                >span {
                    display: block;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                &:hover {
                    color: $color-bilibili-blue;
                }
            }

            .review-state {
                font-size: 14px;
                font-weight: 500;

                .state-item {
                    padding: 2px 6px;
                    background-color: $color-mask-10;
                    border-radius: 10px;
                }

                .transcoding,
                .pending-review {
                    color: $color-text-secondary;
                }

                .passed {
                    background-color: $color-clear-green-background;
                    color: $color-clear-green;
                }

                .transcoding-failed,
                .not-passed {
                    background-color: $color-warning-red-background;
                    color: $color-warning-red;
                }
            }

            .extra-info {
                .info-text {
                    font-size: 15px;
                    font-weight: 500;
                    color: $color-warning-red;
                }
            }
        }

        .other-info {
            margin: 10px 0;
            line-height: 20px;

            display: flex;
            justify-content: space-between;
            align-items: center;

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

            .count {
                display: flex;
                column-gap: 10px;

                color: $color-text-secondary;

                .iconfont {
                    font-size: 14px;

                    &::before {
                        margin-right: 3px;
                    }
                }
            }

            .left {

                .post-date {
                    margin: 10px 0;
                    display: flex;
                    flex-direction: column;
                    font-size: 14px;
                    font-weight: 500;

                    color: $color-text-secondary;

                    .create-time,
                    .last-update-time {
                        font-size: 13px;
                    }
                }
            }

            .right {
                $border-radius: 10px;

                display: flex;
                column-gap: 20px;
                align-items: center;

                .options {
                    display: flex;
                    margin-right: 10px;
                    border-radius: $border-radius;

                    cursor: pointer;
                    position: relative;

                    transition: background-color 0.2s ease;

                    &:hover {
                        background-color: $color-mask-10;
                    }

                    img {
                        border: 1px solid $color-mask-20;
                        border-radius: $border-radius;
                    }

                    .options-panel {
                        position: absolute;
                        top: calc(100% + 8px);
                        right: 0;
                        z-index: 3000;

                        width: 200px;
                        background-color: #fff;
                        border-radius: 8px;
                        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
                        padding: 12px 0;

                        display: flex;
                        flex-direction: column;

                        /* ── 上部分 ── */
                        .panel-top {
                            display: flex;
                            justify-content: space-around;
                            padding: 0 12px 10px;

                            .panel-top-item {
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                gap: 4px;
                                cursor: pointer;
                                padding: 6px 12px;
                                border-radius: 6px;
                                transition: background-color 0.2s ease;

                                &:hover {
                                    background-color: $color-mask-10;
                                }

                                .iconfont {
                                    font-size: 22px;
                                    color: $color-text-secondary;
                                }

                                .panel-item-text {
                                    font-size: 12px;
                                    color: $color-text-secondary;
                                    white-space: nowrap;
                                }
                            }
                        }

                        /* ── 分隔线 ── */
                        .panel-divider {
                            height: 1px;
                            background-color: $color-border;
                            margin: 0 12px;
                        }

                        /* ── 中部分 ── */
                        .panel-middle {
                            padding: 10px 16px;
                            display: flex;
                            flex-direction: column;
                            gap: 8px;
                        }

                        /* ── 下部分 ── */
                        .panel-bottom {
                            padding: 10px 16px 4px;

                            .delete-btn {
                                width: 100%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 6px;

                                .icon-delete {
                                    font-size: 16px;
                                }
                            }
                        }
                    }
                }
            }
        }

        .other-info.vertical {
            display: flex;
            flex-direction: column;
            align-items: start;

            .count {
                display: flex;
                column-gap: 10px;
            }
        }
    }
}
</style>
