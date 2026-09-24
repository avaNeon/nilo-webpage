<script lang="ts" setup>
import Avatar from '@/shared/entities/avatar/ui/Avatar.vue';
import type { VideoComment } from '@/shared/model/VideoComment';
import Cover from '@/shared/ui/Cover.vue';
import { imgRequestUrl } from '@/shared/utils/ImgUtil';
import { computed, ref } from 'vue';
import { useVideoCommentItem, calcDefaultFoldReason, COMMENT_AVATAR_METRICS } from '../model/useVideoCommentItem';
import { DefaultFoldReason } from '@/shared/model/VideoComment';
import { useRoute } from 'vue-router';
import CommentPostBar from '@/pages/videoDetail/features/commentPostBar/ui/CommentPostBar.vue';
import { formatPostTime } from '@/shared/utils/DateUtil';
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

const { COMMENT_IMG_WIDTH, checkLogin, upvote, downvote, deleteComment, calcVoteResult, isConfirming, cooldownActive, borderProgress, deleteButtonText, topComment, cancelTopComment } = useVideoCommentItem()
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

/** 评论者是否为视频发布者（显示「作者」徽章） */
const isAuthorComment = computed(() =>
{
    const publisherUserId = videoStateStore.videoInfo?.userInfo?.userId
    if (props.videoComment.userId == null || publisherUserId == null) return false
    return String(props.videoComment.userId) === String(publisherUserId)
})

/** 楼中楼回复（顶层评论的 parentCommentId 为 '0'），头像更小 */
const isReply = computed(() => String(props.videoComment.parentCommentId) !== '0')

const avatarMetrics = computed(() => isReply.value ? COMMENT_AVATAR_METRICS.reply : COMMENT_AVATAR_METRICS.root)

const itemStyle = computed(() => ({
    '--avatar-size': `${avatarMetrics.value.size}px`,
    '--avatar-gap': `${avatarMetrics.value.gap}px`,
}))

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

const postTime = computed(() => formatPostTime(props.videoComment?.postTime))

const deletedBy = computed(() =>
{
    switch (props.videoComment.deleted)
    {
        case 1: return '用户';
        case 2: return '视频发布者';
        case 3: return '管理员';
        default: return '';
    }
})

const isDeleted = computed(() => props.videoComment.deleted !== 0)

const imgList = computed(() =>
{
    const imgPaths = props.videoComment.imgPaths
    return imgPaths ? imgPaths.split(',').filter(path => path != null && path != '') : []
})

/** 评论作者本人或视频发布者可删除 */
const canDelete = computed(() =>
    (props.videoComment.userId == loginStateStore.userInfo?.userId || isVideoPublisher.value) && props.videoComment.deleted === 0)

/** 仅视频发布者可置顶顶层评论 */
const canPin = computed(() => isVideoPublisher.value && !isDeleted.value && props.videoComment.parentCommentId === '0')

// 已删除的评论：按钮不可点，但悬停时仍然展开（颜色变淡）
function onUpvote()
{
    if (!isDeleted.value) upvote(route.params.videoId as string, props.videoComment)
}

function onDownvote()
{
    if (!isDeleted.value) downvote(route.params.videoId as string, props.videoComment)
}

function onReply()
{
    if (!isDeleted.value) toggleReplyFoldState()
}

function onDelete()
{
    deleteComment(props.videoComment, isVideoPublisher.value && props.videoComment.userId != loginStateStore.userInfo?.userId)
}

function onTogglePin()
{
    if (props.videoComment.topType === 1)
    {
        cancelTopComment(props.videoComment)
    }
    else
    {
        topComment(props.videoComment)
    }
}

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
            return deletedBy.value
                ? `该评论已被${deletedBy.value}删除`
                : '该评论已被删除'
        default:
            return ''
    }
})
</script>

<template>
    <div class="comment-item" :class="{ folded: folded, reply: isReply }" :style="itemStyle">
        <!-- 折叠态：头像位置换成展开按钮 -->
        <button v-if="folded" type="button" class="unfold-btn" aria-label="展开评论" title="展开评论"
            @click="onClickUnfold"></button>
        <!-- 正常态：显示用户头像 -->
        <div v-else class="avatar-wrap">
            <Avatar class="comment-avatar" :user-id="videoComment.userId" :src="imgRequestUrl(videoComment.avatar, true)"
                :width="avatarMetrics.size" :lazy="true" :user-panel="false" :mobile="false" :require-login="false" />
        </div>

        <div class="body">
            <div class="name-row" @click="switchFold">
                <span class="nick-name">{{ videoComment.nickName }}</span>
                <span v-if="isAuthorComment" class="badge author">作者</span>
                <span class="post-time">{{ postTime }}</span>
                <span v-if="videoComment.topType === 1" class="badge muted">置顶</span>
                <!-- 默认折叠原因徽章 -->
                <span v-if="folded && defaultFoldReason === DefaultFoldReason.INAPPROPRIATE" class="badge muted"
                    :title="foldBadgeLabel">E</span>
                <span v-if="folded && defaultFoldReason === DefaultFoldReason.LOW_VOTES" class="badge muted"
                    :title="foldBadgeLabel">{{ voteResult }}</span>
                <span v-if="folded && defaultFoldReason === DefaultFoldReason.DELETED_LOW_VOTES" class="badge muted"
                    :title="foldBadgeLabel">已删除</span>
            </div>

            <template v-if="!folded">
                <template v-if="videoComment.deleted === 0">
                    <p v-if="videoComment.content" class="content">{{ videoComment.content }}</p>
                    <div v-if="imgList.length > 0" class="images">
                        <Cover v-for="(imgPath, index) in imgList" :key="index" class="comment-image"
                            :src="imgRequestUrl(imgPath)" :width="COMMENT_IMG_WIDTH" :preview="true" fit="scale-down"
                            :autoHeight="true" :thumbnail="true" :border-radius="10" />
                    </div>
                </template>
                <p v-else class="content deleted">[评论已被{{ deletedBy }}删除]</p>

                <!-- 操作行：悬停时数字 / 文字从图标右侧弹出 -->
                <div class="bottom-items">
                    <!-- upvote -->
                    <button type="button" class="bottom-item upvote"
                        :class="{ clicked: videoComment.isUpvoted, disabled: isDeleted }" :aria-disabled="isDeleted"
                        :aria-label="`赞 ${videoComment.upvoteCount}`" @click="onUpvote">
                        <span class="iconfont icon-upvote"></span>
                        <span class="detail-text">{{ videoComment.upvoteCount }}</span>
                    </button>
                    <!-- vote-result -->
                    <span class="vote-result" title="赞数减踩数">{{ voteResult }}</span>
                    <!-- downvote -->
                    <button type="button" class="bottom-item downvote"
                        :class="{ clicked: videoComment.isDownvoted, disabled: isDeleted }" :aria-disabled="isDeleted"
                        :aria-label="`踩 ${videoComment.downvoteCount}`" @click="onDownvote">
                        <span class="iconfont icon-downvote"></span>
                        <span class="detail-text">{{ videoComment.downvoteCount }}</span>
                    </button>
                    <!-- reply -->
                    <button type="button" class="bottom-item reply"
                        :class="{ clicked: !isReplyFolded, disabled: isDeleted }" :aria-disabled="isDeleted"
                        @click="onReply">
                        <span class="iconfont icon-reply"></span>
                        <span class="description-text">{{ isDeleted ? '无法回复' : '回复' }}</span>
                        <span class="detail-text">{{ videoComment.replyCount }}</span>
                    </button>
                    <!-- delete：第一次点击进入确认，冷却结束后才能确认删除 -->
                    <button v-if="canDelete" type="button" class="bottom-item delete"
                        :class="{ confirming: isConfirming, cooldown: cooldownActive }" :disabled="cooldownActive"
                        @click="onDelete">
                        <span class="iconfont icon-delete"></span>
                        <span class="description-text">{{ deleteButtonText }}</span>
                        <span v-if="cooldownActive" class="delete-border-overlay"
                            :style="{ background: `conic-gradient(from -90deg, rgba(255, 68, 68, 0.6) ${borderProgress * 360}deg, transparent 0deg)` }">
                        </span>
                    </button>
                    <!-- pin/un-pin -->
                    <button v-if="canPin" type="button" class="bottom-item top-comment" @click="onTogglePin">
                        <span :class="['iconfont', videoComment.topType === 1 ? 'icon-unpin-fill' : 'icon-pin-fill']"></span>
                        <span class="description-text">{{ videoComment.topType === 1 ? '取消置顶' : '置顶' }}</span>
                    </button>
                </div>
            </template>

            <div class="reply-bar" v-show="!isReplyFolded && !folded">
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
        </div>
    </div>
</template>

<style lang="scss" scoped>
// 头像尺寸 / 间距来自 COMMENT_AVATAR_METRICS（通过 --avatar-size / --avatar-gap 传入）
// 上内边距需与 COMMENT_AVATAR_METRICS.top 保持一致：CommentThread 依此计算连线位置
.comment-item {
    display: flex;
    align-items: flex-start;
    gap: var(--avatar-gap);

    // 顶层评论：1px 分隔线 + 20px 上内边距
    padding-top: 20px;
    border-top: 1px solid $warm-line-soft;

    // 楼中楼回复：无分隔线，14px 上内边距
    &.reply {
        padding-top: 14px;
        border-top: none;
    }

    // 折叠态只剩一行昵称，与展开按钮垂直居中
    &.folded {
        align-items: center;
    }
}

// ==================== 头像 ====================
.avatar-wrap {
    position: relative;
    flex-shrink: 0;
    width: var(--avatar-size);
    height: var(--avatar-size);
    border-radius: 50%;
    background: $warm-sunken;

    // 细描边压在图片上方
    &::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 50%;
        box-shadow: inset 0 0 0 1px rgba(11, 12, 18, 0.06);
        pointer-events: none;
    }

    // Avatar 自带 z-index: 500（给用户面板用），评论头像不需要，去掉以免盖住表情面板等浮层
    .comment-avatar {
        z-index: auto;
    }

    .comment-avatar :deep(.avatar) {
        display: block;
        z-index: auto;
    }

    :deep(.image-container) {
        border: none !important;
        background: $warm-sunken;
    }
}

// 折叠态的展开按钮：与头像同尺寸的圆，中间一个加号
.unfold-btn {
    position: relative;
    flex-shrink: 0;
    width: var(--avatar-size);
    height: var(--avatar-size);
    padding: 0;
    border: none;
    border-radius: 50%;
    background: $warm-sunken;
    color: $warm-ink-3;
    cursor: pointer;
    transition: background-color 0.2s ease, color 0.2s ease;

    &::before,
    &::after {
        content: '';
        position: absolute;
        left: 50%;
        top: 50%;
        width: 10px;
        height: 1.5px;
        margin: -0.75px 0 0 -5px;
        border-radius: 1px;
        background: currentColor;
    }

    &::after {
        transform: rotate(90deg);
    }

    &:hover,
    &:focus-visible {
        background: $warm-accent-soft;
        color: $warm-accent;
        outline: none;
    }
}

// ==================== 正文 ====================
.body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

// 昵称行：点击折叠 / 展开
.name-row {
    align-self: flex-start;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    margin: -2px -8px;
    padding: 2px 8px;
    border-radius: 999px;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
        background-color: $warm-sunken;
    }

    .nick-name {
        font-size: 14px;
        font-weight: 600;
        line-height: 20px;
        color: $warm-ink;
    }

    .post-time {
        font-size: 12px;
        color: $warm-ink-4;
    }

    .badge {
        display: flex;
        align-items: center;
        height: 18px;
        padding: 0 7px;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 600;

        &.author {
            color: #FFFFFF;
            background: $warm-accent;
        }

        &.muted {
            color: $warm-ink-3;
            background: $warm-sunken;
        }
    }
}

.content {
    margin: 0;
    font-size: 15px;
    line-height: 1.8;
    color: $warm-ink-2;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    text-wrap: pretty;

    &.deleted {
        color: $warm-ink-4;
    }
}

.reply .content {
    font-size: 14px;
    line-height: 1.7;
}

.images {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding-top: 2px;

    .comment-image {
        background: $warm-sunken;
    }
}

// ==================== 操作行（warm-redesign 之前的弹簧伸缩样式） ====================
// 图标常驻，悬停时数字 / 文字从 max-width: 0 展开并向右推开，底色换成各自的主题色
.bottom-items {
    display: flex;
    column-gap: 8px;
    align-items: center;
    margin-left: -5px;
    font-size: 15px;
    color: $warm-ink-4;

    .vote-result {
        min-width: 12px;
        padding: 5px 0;
        font-size: 14px;
        font-weight: 500;
        text-align: center;
        color: $warm-ink-3;
        font-variant-numeric: tabular-nums;
    }

    .bottom-item {
        position: relative;
        display: flex;
        align-items: center;
        padding: 5px;
        border: none;
        border-radius: 999px;
        background: transparent;
        font: inherit;
        color: inherit;
        cursor: pointer;
        transition: all 0.25s ease;

        &:focus-visible {
            outline: 2px solid $warm-accent;
            outline-offset: 1px;
        }

        &.disabled {
            cursor: default;
        }

        .iconfont {
            font-size: 16px;
            line-height: 18px;
        }
    }

    // 数字：默认收起，悬停展开
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
            font-size: 14px;
            line-height: 18px;
            font-variant-numeric: tabular-nums;
        }
    }

    .upvote {
        &.clicked {
            color: $color-upvote-red;
        }

        &:hover {
            color: $color-upvote-red;
            background-color: $color-upvote-red-background;
        }

        &.disabled:hover {
            color: rgba(217, 57, 0, 0.5);
            background-color: rgba(217, 58, 0, 0.06);
        }
    }

    .downvote {
        &.clicked {
            color: $color-downvote-purple;
        }

        &:hover {
            color: $color-downvote-purple;
            background-color: $color-downvote-purple-background;
        }

        &.disabled:hover {
            color: rgba(106, 92, 255, 0.5);
            background-color: rgba(106, 92, 255, 0.06);
        }
    }

    .reply {
        .iconfont {
            margin-right: 3px;
            font-size: 17px;
        }

        &.clicked {
            color: $color-reply-green;
        }

        &:hover {
            background-color: $color-reply-green-background;
            color: $color-reply-green;

            .description-text {
                max-width: 50px;
                padding-right: 10px;
                transform: translateX(5px);
            }
        }

        &.disabled:hover {
            color: rgba(68, 160, 2, 0.5);
            background-color: rgba(68, 160, 2, 0.06);

            .description-text {
                max-width: 80px;
            }
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
            font-size: 14px;
            line-height: 18px;
        }
    }

    .delete {
        overflow: visible;

        .iconfont {
            margin-right: 6px;
            font-size: 17px;
        }

        .description-text {
            display: inline-block;
            font-size: 14px;
            line-height: 15px;
            vertical-align: middle;
            max-width: 0;
            overflow: hidden;
            white-space: nowrap;
            transition: max-width 0.35s ease, margin-right 0.35s ease;
        }

        // 确认状态：文字常驻展开
        &.confirming {
            color: rgb(229, 40, 40);

            .description-text {
                max-width: 80px;
            }
        }

        // 冷却中：不可点，边框走完一圈才能确认
        &.cooldown {
            pointer-events: none;
            cursor: not-allowed;
            color: rgba(255, 0, 0, 0.35);
        }

        &:hover:not(.cooldown):not(.confirming) {
            color: rgb(229, 40, 40);
            background-color: rgba(255, 0, 0, 0.12);

            .description-text {
                max-width: 50px;
                margin-right: 5px;
            }
        }

        &.confirming:hover {
            background-color: rgba(255, 0, 0, 0.12);
        }

        // 冷却进度：沿按钮边框走一圈
        .delete-border-overlay {
            position: absolute;
            inset: -2px;
            border-radius: 999px;
            padding: 2px;
            pointer-events: none;
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
        }
    }

    .top-comment {
        overflow: visible;
        padding-left: 10px;
        padding-right: 5px;

        .iconfont {
            margin-right: 5px;

            &.icon-pin-fill {
                font-size: 14px;
            }

            &.icon-unpin-fill {
                font-size: 17px;
            }
        }

        .description-text {
            display: inline-block;
            font-size: 14px;
            line-height: 15px;
            vertical-align: middle;
            max-width: 0;
            overflow: hidden;
            white-space: nowrap;
            transition: max-width 0.35s ease, margin-right 0.35s ease;
        }

        &:hover {
            color: $warm-accent;
            background-color: $warm-accent-soft;

            .description-text {
                max-width: 80px;
                margin-right: 5px;
            }
        }
    }
}

// 回复输入框：与正文左对齐
.reply-bar {
    padding-top: 6px;
}
</style>
