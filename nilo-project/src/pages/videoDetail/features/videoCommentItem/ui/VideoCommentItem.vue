<script lang="ts" setup>
import Avatar from '@/shared/entities/avatar/ui/Avatar.vue';
import type { VideoComment } from '@/shared/model/VideoComment';
import Cover from '@/shared/ui/Cover.vue';
import { imgRequestUrl } from '@/shared/utils/ImgUtil';
import unfoldSvg from '@/assets/icon/img/unfold.svg';
import { computed, ref } from 'vue';
import { useVideoCommentItem, calcDefaultFoldReason } from '../model/useVideoCommentItem';
import { DefaultFoldReason } from '@/shared/model/VideoComment';
import { useRoute } from 'vue-router';
import CommentPostBar from '@/pages/videoDetail/features/commentPostBar/ui/CommentPostBar.vue';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useLoginStateStore } from '@/shared/store/LoginStateStore';
import useVideoStateStore from '@/pages/videoDetail/store/VideoStateStore';

const props = withDefaults(defineProps<{
    videoComment: VideoComment,
    folded?: boolean
}>(), {
    folded: false
})

const emit = defineEmits<{
    (e: 'unfold'): void
    (e: 'switchFold'): void
    (e: 'addCommentCount'): void
}>()

const { COMMENT_IMG_WIDTH, AVATAR_WIDTH, checkLogin, upvote, downvote, deleteComment, calcVoteResult, isConfirming, cooldownActive, borderProgress, deleteButtonText, topComment, cancelTopComment } = useVideoCommentItem()
const route = useRoute()

const loginStateStore = useLoginStateStore()
const videoStateStore = useVideoStateStore()

/** 当前用户是否为视频发布者 */
const isVideoPublisher = computed(() =>
{
    const currentUserId = loginStateStore.userInfo?.userId
    const publisherUserId = videoStateStore.videoInfo?.userInfo?.userId
    if (currentUserId == null || publisherUserId == null) return false
    return String(currentUserId) === String(publisherUserId)
})

const voteResult = computed(() =>
{
    if (!props.videoComment)
    {
        return '-'
    }
    return calcVoteResult(props.videoComment)
})

function switchFold()
{
    emit('switchFold')
}

function onClickUnfold()
{
    emit('unfold')
}

const isReplyFolded = ref(true)

function toggleReplyFoldState()
{
    if (!checkLogin()) return
    isReplyFolded.value = !isReplyFolded.value
}

const postTime = computed(() =>
{
    const now: Dayjs = dayjs()
    let postDate: Dayjs
    if (!props.videoComment || !props.videoComment.postTime)
    {
        return ''
    }
    postDate = dayjs(props.videoComment.postTime)
    const diffMin = now.diff(postDate, 'minute')
    if (diffMin < 1)
    {
        return '刚刚'
    }
    else
    {
        return postDate.format('YYYY-MM-DD HH:mm')
    }
})

const deletedBy = computed(() =>
{
    switch (props.videoComment.deleted)
    {
        case 1: return '用户';
        case 2: return '视频制作者';
    }
})

const isDeleted = computed(() => props.videoComment.deleted !== 0)

// ----- 默认折叠原因 -----
const defaultFoldReason = computed(() =>
{
    // 优先使用后端下发的值，没有则前端计算
    if (props.videoComment.defaultFoldReason !== undefined && props.videoComment.defaultFoldReason !== 0)
    {
        return props.videoComment.defaultFoldReason
    }
    return calcDefaultFoldReason(props.videoComment)
})

const foldBadgeLabel = computed(() =>
{
    switch (defaultFoldReason.value)
    {
        case DefaultFoldReason.INAPPROPRIATE:
            return '该评论可能包含不适宜内容'
        case DefaultFoldReason.LOW_VOTES:
            return `该评论被大量点踩（${voteResult.value}）`
        case DefaultFoldReason.DELETED_LOW_VOTES:
            return '该评论已被删除'
        default:
            return ''
    }
})
</script>

<template>
    <div class="comment-item" :class="{ folded: folded }">
        <!-- 折叠态：显示 unfold 加号图标 -->
        <div v-if="folded" class="unfold-btn" @click="onClickUnfold">
            <img :src="unfoldSvg" alt="展开" class="unfold-icon" />
        </div>
        <!-- 正常态：显示用户头像 -->
        <Avatar v-else class="avatar" :user-id="videoComment.userId" :src="imgRequestUrl(videoComment.avatar)"
            :width="AVATAR_WIDTH" :lazy="true" :user-panel="false" :mobile="false" :require-login="false" />
        <div class="info">
            <div class="top-info" @click="switchFold">
                <span class="user-name-text">{{ videoComment.nickName }}</span>
                <span class="separator"> · </span>
                <span class="reply-time">{{ postTime }}</span>
                <span class="top-type" v-if="videoComment.topType === 1">置顶</span>
                <!-- 默认折叠原因徽章 -->
                <span v-if="folded && defaultFoldReason === DefaultFoldReason.INAPPROPRIATE"
                    class="fold-badge inappropriate" :title="foldBadgeLabel">E</span>
                <span v-if="folded && defaultFoldReason === DefaultFoldReason.LOW_VOTES" class="fold-badge low-votes"
                    :title="foldBadgeLabel">{{ voteResult }}</span>
                <span v-if="folded && defaultFoldReason === DefaultFoldReason.DELETED_LOW_VOTES"
                    class="fold-badge deleted" :title="foldBadgeLabel">已删除</span>
            </div>
            <template v-if="!folded">
                <div v-if="videoComment.deleted === 0" class="content-info">
                    <span class="comment-content">{{ videoComment.content }}</span>
                    <div class="images">
                        <div class="image" v-show="videoComment.imgPaths != null && videoComment.imgPaths.length > 0"
                            v-for="imgPath in videoComment.imgPaths ? videoComment.imgPaths.split(',') : []">
                            <Cover v-if="imgPath != null && imgPath != ''" :src="imgRequestUrl(imgPath)"
                                :width="COMMENT_IMG_WIDTH" :preview="true" fit="scale-down" :autoHeight="true"
                                :thumbnail="true" />
                        </div>
                    </div>
                </div>
                <div v-else class="content-info">
                    <span> [评论已被{{ deletedBy }}删除] </span>
                </div>
                <div class="bottom-items">
                    <!-- upvote -->
                    <div :class="{ 'bottom-item': true, upvote: true, isClicked: videoComment.isUpvoted, disabled: isDeleted }"
                        @click="!isDeleted && upvote(route.params.videoId as string, props.videoComment)">
                        <div class="iconfont icon-upvote">
                            <span class="detail-text">{{ videoComment.upvoteCount }}</span>
                        </div>
                    </div>
                    <!-- vote-result -->
                    <div class="vote-result">
                        {{ voteResult }}
                    </div>
                    <!-- downvote -->
                    <div :class="{ 'bottom-item': true, downvote: true, isClicked: videoComment.isDownvoted, disabled: isDeleted }"
                        @click="!isDeleted && downvote(route.params.videoId as string, props.videoComment)">
                        <div class="iconfont icon-downvote">
                            <span class="detail-text">{{ videoComment.downvoteCount }}</span>
                        </div>
                    </div>
                    <!-- reply -->
                    <div :class="{ 'bottom-item': true, reply: true, disabled: isDeleted }"
                        @click="!isDeleted && toggleReplyFoldState()">
                        <div class="iconfont icon-reply">
                            <span class="description-text">{{ isDeleted ? '无法回复' : '回复' }}</span>
                            <span class="detail-text">{{ videoComment.replyCount }}</span>
                        </div>
                    </div>
                    <!-- delete -->
                    <div v-if="(videoComment.userId == loginStateStore.userInfo?.userId || isVideoPublisher) && videoComment.deleted === 0"
                        :class="{ 'bottom-item': true, 'delete': true, 'confirming': isConfirming, 'cooldown': cooldownActive }"
                        @click="deleteComment(props.videoComment, isVideoPublisher && videoComment.userId != loginStateStore.userInfo?.userId)">
                        <div class="iconfont icon-delete">
                            <span class="description-text">{{ deleteButtonText }}</span>
                        </div>
                        <div v-if="cooldownActive" class="delete-border-overlay"
                            :style="{ background: `conic-gradient(from -90deg, rgba(255, 68, 68, 0.6) ${borderProgress * 360}deg, transparent 0deg)` }">
                        </div>
                    </div>
                    <!-- pin/un-pin -->
                    <div v-if="isVideoPublisher && !isDeleted && videoComment.parentCommentId === '0'"
                        :class="{ 'bottom-item': true, 'top-comment': true }"
                        @click="videoComment.topType === 1 ? cancelTopComment(props.videoComment) : topComment(props.videoComment)">
                        <div :class="['iconfont', videoComment.topType === 1 ? 'icon-unpin-fill' : 'icon-pin-fill']">
                            <span class="description-text">{{ videoComment.topType === 1 ? '取消置顶' : '置顶' }}</span>
                        </div>
                    </div>
                </div>
            </template>
        </div>
    </div>
    <div class="reply-bar" v-show="!isReplyFolded">
        <CommentPostBar :parent-comment-id="videoComment.commentId" :placeholder="`回复${videoComment.nickName}`"
            @comment-posted="(comment) =>
            {
                if (videoComment.childCommentList)
                {
                    videoComment.childCommentList.unshift(comment)
                }
                else
                {
                    videoComment.childCommentList = [comment]
                }
                videoComment.replyCount++
                emit('addCommentCount')
            }" />
    </div>
</template>

<style lang="scss" scoped>
$unfold-btn-size: 20px;

.comment-item {
    display: flex;
    column-gap: 10px;
    border-top: 1px solid $color-neutral-3;
    padding: 20px 0 10px;
    border-radius: 20px;

    // 折叠态：avatar区域替换为unfold按钮
    &.folded {
        .unfold-btn {
            margin: 22px 20px 22px 0;

            flex-shrink: 0;
            width: $unfold-btn-size;
            height: $unfold-btn-size;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            cursor: pointer;
            transition: background-color 0.15s ease;

            &:hover {
                background-color: $color-neutral-3;

                .unfold-icon {
                    filter: brightness(0);
                }
            }

            .unfold-icon {
                width: 20px;
                height: 20px;
                opacity: 0.55;
                transition: opacity 0.15s ease, filter 0.15s ease;
            }
        }

        .info {
            // 折叠态隐藏 row-gap，仅保留 top-info
            row-gap: 0;

            .top-info {
                padding: 0 10px;
                margin: 15px;
            }
        }
    }

    .unfold-btn {
        flex-shrink: 0;
    }

    .avatar {
        height: 64px;
    }

    .info {
        display: flex;
        flex-direction: column;
        row-gap: 10px;

        .top-info {
            display: flex;
            align-items: center;

            flex: 1;
            align-self: flex-start;

            font-size: 14px;

            padding: 5px 10px;
            border-radius: 15px;
            cursor: pointer;
            transition: background-color 0.2s ease;

            &:hover {
                background-color: $color-neutral-1;
            }

            .user-name-text {
                font-size: 16px;
                font-weight: 500;
            }

            .separator {
                margin: 0 5px;
                color: $color-carousel-bg-1;
            }

            .reply-time {
                color: $color-carousel-bg-1;
            }

            .top-type {
                margin-left: 10px;
                padding: 3px 8px;

                font-size: 12px;
                font-weight: 500;

                color: $color-text-secondary;

                border-radius: 10px;
                background-color: $color-neutral-3;
            }

            .fold-badge {
                margin-left: 10px;
                padding: 3px 8px;

                font-size: 12px;
                font-weight: 500;

                color: $color-text-secondary;
                border-radius: 10px;
                background-color: $color-neutral-3;
                cursor: default;
            }
        }

        .content-info {
            font-size: 16px;

            padding-left: 10px;

            display: flex;
            flex-direction: column;
            row-gap: 10px;

            .images {
                display: flex;
                column-gap: 10px;
            }
        }

        .bottom-items {
            display: flex;
            column-gap: 10px;
            align-items: center;

            font-size: 16px;
            color: $color-text-secondary;

            padding-left: 10px;

            .vote-result {
                font-size: 16px;
                padding: 5px 0;
            }

            .bottom-item {
                border-radius: 20px;
                padding: 5px;
                transition: all 0.25s ease;

                &:hover {
                    cursor: pointer;
                }
            }

            .upvote,
            .downvote {

                &:hover {

                    .detail-text {
                        max-width: 50px;
                        padding-right: 10px;
                        transform: translateX(5px);
                    }
                }

                .detail-text {
                    display: inline-block;
                    max-width: 0;
                    overflow: hidden;
                    white-space: nowrap;
                    vertical-align: bottom;
                    transition: all 0.25s ease;

                    font-size: 16px;
                    line-height: 16px;
                }

            }

            .upvote {

                &.isClicked {
                    color: $color-upvote-red;
                }

                &:hover {
                    color: $color-upvote-red;
                    background-color: $color-upvote-red-background;
                }

                &.disabled {
                    cursor: default;

                    &:hover {
                        color: rgba(217, 57, 0, 0.5);
                        background-color: rgba(217, 58, 0, 0.06);

                        .detail-text {
                            max-width: 50px;
                            padding-right: 10px;
                            transform: translateX(5px);
                        }
                    }
                }
            }

            .downvote {

                &.isClicked {
                    color: $color-downvote-purple;
                }

                &:hover {
                    color: $color-downvote-purple;
                    background-color: $color-downvote-purple-background;
                }

                &.disabled {
                    cursor: default;

                    &:hover {
                        color: rgba(106, 92, 255, 0.5);
                        background-color: rgba(106, 92, 255, 0.06);

                        .detail-text {
                            max-width: 50px;
                            padding-right: 10px;
                            transform: translateX(5px);
                        }
                    }
                }
            }


            .reply {
                display: flex;
                align-items: center;

                &:hover {
                    background-color: $color-reply-green-background;
                    color: $color-reply-green;

                    .description-text {
                        max-width: 50px;
                        padding-right: 10px;
                        transform: translateX(5px);
                    }
                }

                &.disabled {
                    cursor: default;

                    &:hover {
                        color: rgba(68, 160, 2, 0.5);
                        background-color: rgba(68, 160, 2, 0.06);

                        .description-text {
                            max-width: 80px;
                            padding-right: 10px;
                            transform: translateX(5px);
                        }
                    }
                }

                .icon-reply {
                    font-size: 18px;
                }

                .icon-reply::first-letter {
                    margin-right: 3px;
                }

                .description-text {
                    display: inline-block;
                    max-width: 0;
                    overflow: hidden;
                    white-space: nowrap;
                    vertical-align: bottom;
                    transition: all 0.25s ease;
                }

                .detail-text {
                    margin-right: 4px;
                }

                .description-text,
                .detail-text {
                    font-size: 15px;
                    line-height: 18px;
                }

            }

            .delete {
                display: flex;
                align-items: center;
                position: relative;
                overflow: visible;

                .icon-delete {
                    display: flex;
                    align-items: center;
                    column-gap: 6px;
                    font-size: 19px;
                    margin-top: 1px;
                }

                .description-text {
                    display: inline-block;
                    font-size: 15px;
                    line-height: 15px;
                    vertical-align: middle;
                    max-width: 0;
                    overflow: hidden;
                    white-space: nowrap;
                    transition: max-width 0.35s ease, margin-right 0.35s ease;
                }

                // 确认状态：文字常驻展开
                &.confirming {
                    .description-text {
                        max-width: 80px;
                    }
                }

                // 冷却/禁用状态
                &.cooldown {
                    pointer-events: none;
                    cursor: not-allowed;

                    .icon-delete {
                        color: rgba(255, 0, 0, 0.35);
                    }

                    .description-text {
                        color: rgba(255, 0, 0, 0.35);
                    }
                }

                &:hover:not(.cooldown):not(.confirming) {
                    background-color: rgba(255, 0, 0, 0.3);

                    .description-text {
                        max-width: 50px;
                        margin-right: 5px;
                    }
                }

                &.confirming:hover {
                    background-color: rgba(255, 0, 0, 0.3);
                }

                // 边框动画叠加层
                .delete-border-overlay {
                    position: absolute;
                    inset: -2px;
                    border-radius: 22px;
                    padding: 2px;
                    pointer-events: none;
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                }
            }

            .top-comment {
                display: flex;
                align-items: center;
                position: relative;
                overflow: visible;

                padding-left: 10px;
                padding-right: 5px;

                .iconfont {
                    display: flex;
                    align-items: center;
                    column-gap: 5px;

                    &.icon-pin-fill {
                        font-size: 14px;
                    }

                    &.icon-unpin-fill {
                        font-size: 18px;

                        &::before {
                            line-height: 17px;
                        }
                    }
                }

                .description-text {
                    display: inline-block;
                    font-size: 15px;
                    line-height: 15px;
                    vertical-align: middle;
                    max-width: 0;
                    overflow: hidden;
                    white-space: nowrap;
                    transition: max-width 0.35s ease, margin-right 0.35s ease;
                }

                &:hover {
                    color: $color-bilibili-blue;
                    background-color: rgba(0, 174, 236, 0.1);

                    .description-text {
                        max-width: 80px;
                        margin-right: 5px;
                    }
                }
            }
        }
    }

}

.reply-bar {
    margin-left: 50px;
}
</style>
