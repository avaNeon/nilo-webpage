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
import { formatCount } from '@/shared/utils/NumberUtil';
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

/** 评论者是否为视频发布者（显示 UP 徽章） */
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
                <span v-if="isAuthorComment" class="badge up">UP</span>
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

                <div class="actions">
                    <!-- upvote -->
                    <button type="button" class="action upvote" :class="{ active: videoComment.isUpvoted }"
                        :disabled="isDeleted" @click="upvote(route.params.videoId as string, props.videoComment)">
                        {{ videoComment.upvoteCount > 0 ? `赞 ${formatCount(videoComment.upvoteCount)}` : '赞' }}
                    </button>
                    <!-- downvote -->
                    <button type="button" class="action downvote" :class="{ active: videoComment.isDownvoted }"
                        :disabled="isDeleted" @click="downvote(route.params.videoId as string, props.videoComment)">
                        踩
                    </button>
                    <!-- reply -->
                    <button type="button" class="action reply" :class="{ active: !isReplyFolded }" :disabled="isDeleted"
                        @click="toggleReplyFoldState()">
                        {{ isDeleted ? '无法回复' : '回复' }}
                    </button>

                    <!-- 管理操作：悬停评论时显示 -->
                    <div v-if="canPin || canDelete" class="manage" :class="{ confirming: isConfirming }">
                        <!-- pin/un-pin -->
                        <button v-if="canPin" type="button" class="action"
                            @click="videoComment.topType === 1 ? cancelTopComment(props.videoComment) : topComment(props.videoComment)">
                            {{ videoComment.topType === 1 ? '取消置顶' : '置顶' }}
                        </button>
                        <!-- delete：第一次点击进入确认，3 秒冷却后才能确认删除 -->
                        <button v-if="canDelete" type="button" class="action delete"
                            :class="{ confirming: isConfirming, cooldown: cooldownActive }" :disabled="cooldownActive"
                            @click="deleteComment(props.videoComment, isVideoPublisher && videoComment.userId != loginStateStore.userInfo?.userId)">
                            {{ deleteButtonText }}
                            <span v-if="cooldownActive" class="delete-progress"
                                :style="{ transform: `scaleX(${borderProgress})` }"></span>
                        </button>
                    </div>
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

    // 顶层评论：1px 分隔线 + 18px 上内边距
    padding-top: 18px;
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
        box-shadow: inset 0 0 0 1px rgba(26, 25, 22, 0.06);
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
    background: $warm-card;
    box-shadow: inset 0 0 0 1px $warm-border-strong;
    color: $warm-ink-3;
    cursor: pointer;
    transition: box-shadow 0.2s ease, color 0.2s ease;

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
        color: $warm-ink;
        box-shadow: inset 0 0 0 1px $warm-ink-3;
        outline: none;
    }
}

// ==================== 正文 ====================
.body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

// 昵称行：点击折叠 / 展开
.name-row {
    align-self: flex-start;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    margin: -2px -6px;
    padding: 2px 6px;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
        background-color: rgba(26, 25, 22, 0.04);
    }

    .nick-name {
        font-size: 13px;
        font-weight: 600;
        line-height: 20px;
        color: $warm-ink;
    }

    .post-time {
        font-size: 12px;
        color: $warm-ink-4;
    }

    .badge {
        padding: 1px 6px;
        border-radius: 6px;
        font-size: 10px;
        font-weight: 600;
        line-height: 16px;

        &.up {
            color: $warm-accent-text;
            background: color-mix(in oklch, oklch(0.63 0.14 45) 12%, white);
        }

        &.muted {
            color: $warm-ink-3;
            background: $warm-sunken;
        }
    }
}

.content {
    margin: 0;
    font-size: 14px;
    line-height: 1.8;
    color: $warm-ink-2;
    white-space: pre-wrap;
    overflow-wrap: anywhere;

    &.deleted {
        color: $warm-ink-4;
    }
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

// ==================== 操作行 ====================
.actions {
    display: flex;
    align-items: center;
    gap: 18px;
    font-size: 12px;
    color: $warm-ink-4;

    .action {
        position: relative;
        padding: 0;
        border: none;
        background: transparent;
        font: inherit;
        line-height: 20px;
        color: inherit;
        cursor: pointer;
        transition: color 0.15s ease;

        &:hover:not(:disabled),
        &:focus-visible {
            color: $warm-ink;
            outline: none;
        }

        &:disabled {
            color: $warm-ink-5;
            cursor: default;
        }

        &.upvote.active {
            color: $warm-accent-text;
            font-weight: 500;
        }

        &.downvote.active,
        &.reply.active {
            color: $warm-ink;
            font-weight: 500;
        }

        // 确认删除：陶土色提示
        &.delete.confirming {
            color: $warm-accent-text;
            font-weight: 500;
        }

        // 冷却中：文字变弱，下方进度条走满后才可确认
        &.delete.cooldown {
            color: $warm-ink-4;
        }
    }

    .manage {
        display: flex;
        align-items: center;
        gap: 18px;
        margin-left: auto;
        opacity: 0;
        transition: opacity 0.2s ease;

        &.confirming {
            opacity: 1;
        }
    }

    .delete-progress {
        position: absolute;
        left: 0;
        right: 0;
        bottom: -1px;
        height: 1.5px;
        border-radius: 1px;
        background: $warm-accent;
        transform-origin: left center;
    }
}

// 悬停 / 键盘聚焦评论时显示管理操作
.comment-item:hover .actions .manage,
.comment-item:focus-within .actions .manage {
    opacity: 1;
}

// 回复输入框：与正文左对齐
.reply-bar {
    padding-top: 6px;
}
</style>
