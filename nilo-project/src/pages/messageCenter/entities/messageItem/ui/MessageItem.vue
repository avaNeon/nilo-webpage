<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import type { UserMessage } from '@/pages/messageCenter/model/UserMessage'
import { MessageType } from '@/pages/messageCenter/model/MessageType'
import { imgRequestUrl } from '@/shared/utils/ImgUtil'
import defaultAvatar from '@/assets/user.svg'
import confirm from '@/shared/lib/confirm'
import { routerToNewPage } from '@/shared/utils/RouteUtil'
import { formatBackendDateTime } from '@/shared/utils/DateUtil'

const props = defineProps<{
    message: UserMessage,
}>()

const emit = defineEmits<{
    (e: 'delete', messageId: string): void;
}>()

const isSystem = computed(() => props.message.messageType === MessageType.SYSTEM || !props.message.senderUserId)
const isUnread = computed(() => props.message.readType === 0)

const senderName = computed(() =>
    isSystem.value ? '系统通知' : props.message.nickName || '未知用户',
)

const avatarFailed = ref(false)
const senderAvatar = computed(() =>
    props.message.avatar && !avatarFailed.value ? imgRequestUrl(props.message.avatar, true) : defaultAvatar,
)

watch(() => props.message.avatar, () =>
{
    avatarFailed.value = false
})

const mainContent = computed(() => props.message.extendJson?.mainContent || '')
const subContent = computed(() => props.message.extendJson?.subContent || '')

const actionText = computed(() =>
{
    switch (props.message.messageType)
    {
        case MessageType.LIKE:
            return '赞了你的视频'
        case MessageType.COLLECT:
            return '收藏了你的视频'
        case MessageType.COMMENT:
            return subContent.value ? '回复了你的评论' : '评论了你的视频'
        default:
            return ''
    }
})

// 评论消息里的 subContent 是被回复的那条（自己的）评论
const quotePrefix = computed(() => props.message.messageType === MessageType.COMMENT ? '我：' : '')

const createTimeText = computed(() => formatBackendDateTime(props.message.createTime) || '未知时间')

/*——————右侧关联视频—————— */

const hasVideo = computed(() => Boolean(props.message.videoId || props.message.videoName))
const coverFailed = ref(false)
const videoCover = computed(() =>
    props.message.videoCover && !coverFailed.value ? imgRequestUrl(props.message.videoCover, true) : '',
)

watch(() => props.message.videoCover, () =>
{
    coverFailed.value = false
})

function onDelete()
{
    if (!props.message.messageId) return

    confirm({
        message: '确认删除这条消息吗？',
        confirmText: '删除',
        confirmFun: () => emit('delete', props.message.messageId!),
    })
}

function goToSenderHome()
{
    if (isSystem.value || !props.message.senderUserId) return

    routerToNewPage(`/user/${props.message.senderUserId}`)
}

function goToVideo()
{
    if (!props.message.videoId) return

    routerToNewPage(`/video/${props.message.videoId}`)
}
</script>

<template>
    <!-- 未读：蓝色描边 + 头像右上角蓝点；点整条消息标记已读（由外层处理） -->
    <div :class="['message-item', { unread: isUnread, 'has-video': hasVideo }]">
        <span :class="['avatar', { system: isSystem, clickable: !isSystem }]" @click="goToSenderHome">
            <img v-if="!isSystem" :src="senderAvatar" alt="" loading="lazy" @error="avatarFailed = true">
            <span v-if="isUnread" class="unread-dot" aria-label="未读"></span>
        </span>

        <div class="message-main">
            <div class="sender-row">
                <span :class="['sender-name', { clickable: !isSystem }]" @click="goToSenderHome">{{ senderName }}</span>
                <span v-if="actionText" class="action">{{ actionText }}</span>
            </div>
            <p v-if="mainContent" class="content">{{ mainContent }}</p>
            <div v-if="subContent" class="quote">
                <span v-if="quotePrefix" class="quote-prefix">{{ quotePrefix }}</span>{{ subContent }}
            </div>
            <div class="bottom-row">
                <span class="create-time">{{ createTimeText }}</span>
                <button type="button" class="text-button" @click.stop="onDelete">删除</button>
            </div>
        </div>

        <button v-if="hasVideo" type="button" :class="['video-link', { clickable: message.videoId }]"
            :disabled="!message.videoId" :title="message.videoName || ''" @click.stop="goToVideo">
            <span class="video-cover">
                <img v-if="videoCover" :src="videoCover" alt="" loading="lazy" @error="coverFailed = true">
            </span>
            <span class="video-name">{{ message.videoName || '视频已失效' }}</span>
        </button>
    </div>
</template>

<style lang="scss" scoped>
// 封面/头像占位：冷灰渐变
$placeholder: linear-gradient(160deg, oklch(0.93 0.008 265), oklch(0.83 0.014 265));

.message-item {
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr);
    gap: 18px;
    padding: 20px 20px 20px 22px;
    border-radius: 22px;
    background: $warm-card;
    box-shadow: $warm-shadow-ring;
    cursor: pointer;
    transition: background-color 0.2s, box-shadow 0.2s;

    &.has-video {
        grid-template-columns: 44px minmax(0, 1fr) 184px;
    }

    &:hover {
        background: $warm-sunken;
    }

    // 新消息：蓝色描边
    &.unread {
        box-shadow: inset 0 0 0 1.5px rgba(0, 0, 242, 0.35);
    }

    button {
        padding: 0;
        border: none;
        background: none;
        font: inherit;
        color: inherit;
        text-align: left;
    }
}

.avatar {
    position: relative;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: $placeholder;

    img {
        display: block;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
    }

    // 系统通知：蓝色圆 + 偏右上的白点
    &.system {
        background: $warm-accent;

        &::after {
            content: '';
            position: absolute;
            left: 24px;
            top: 10px;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #FFFFFF;
        }
    }

    .unread-dot {
        position: absolute;
        right: -1px;
        top: -1px;
        z-index: 1;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: $warm-accent;
        box-shadow: 0 0 0 2.5px #FFFFFF;
    }
}

.clickable {
    cursor: pointer;
}

.message-main {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
    padding-top: 2px;
}

.sender-row {
    display: flex;
    align-items: baseline;
    gap: 10px;
    min-width: 0;

    .sender-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 15px;
        font-weight: 700;
        color: $warm-ink;
        transition: color 0.2s;

        &.clickable:hover {
            color: $warm-accent;
        }
    }

    .action {
        flex-shrink: 0;
        font-size: 13px;
        color: $warm-ink-4;
    }
}

.content {
    margin: 0;
    font-size: 15px;
    line-height: 1.75;
    color: $warm-ink-2;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    text-wrap: pretty;
}

.quote {
    padding: 10px 14px;
    border-radius: 14px;
    background: $warm-sunken;
    font-size: 13px;
    line-height: 1.6;
    color: #4A4E5A;
    white-space: pre-wrap;
    overflow-wrap: anywhere;

    .quote-prefix {
        font-weight: 600;
        color: $warm-ink-3;
    }
}

// 悬停时整条变浅灰，引用框换白底才分得开
.message-item:hover .quote {
    background: #FFFFFF;
}

.bottom-row {
    display: flex;
    align-items: center;
    gap: 18px;
    font-size: 12px;
    color: $warm-ink-4;

    .create-time {
        font-family: $warm-font-mono;
    }

    .text-button {
        font-weight: 500;
        color: $warm-ink-3;
        cursor: pointer;
        transition: color 0.2s;

        &:hover {
            color: $warm-accent;
        }

        &:focus-visible {
            outline: 2px solid $warm-accent;
            outline-offset: 2px;
            border-radius: 4px;
        }
    }
}

.video-link {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
    cursor: default;

    &.clickable {
        cursor: pointer;

        &:hover .video-name {
            color: $warm-accent;
        }
    }

    &:focus-visible {
        outline: 2px solid $warm-accent;
        outline-offset: 2px;
        border-radius: 12px;
    }

    .video-cover {
        display: block;
        aspect-ratio: 16 / 9;
        border-radius: 12px;
        overflow: hidden;
        background: $placeholder;

        img {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    }

    .video-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 12px;
        font-weight: 500;
        color: $warm-ink-3;
        transition: color 0.2s;
    }
}
</style>
