<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { UserMessage } from '@/pages/messageCenter/model/UserMessage'
import { MessageType } from '@/pages/messageCenter/model/MessageType'
import { imgRequestUrl } from '@/shared/utils/ImgUtil'
import defaultAvatar from '@/assets/user.svg'
import deleteSrc from '@/assets/icon/img/delete-plain.svg'
import confirm from '@/shared/lib/confirm'
import { routerToNewPage } from '@/shared/utils/RouteUtil'

const props = defineProps<{
    message: UserMessage,
}>()

const emit = defineEmits<{
    (e: 'delete', messageId: string): void;
}>()

const messageTextRef = ref<HTMLElement | null>(null)
const mainContentRef = ref<HTMLElement | null>(null)
const subContentRef = ref<HTMLElement | null>(null)
const isMainContentExpanded = ref(false)
const isSubContentExpanded = ref(false)
const isMainContentOverflowing = ref(false)
const isSubContentOverflowing = ref(false)
let resizeObserver: ResizeObserver | null = null

type ExpandableContentType = 'main' | 'sub'

const senderAvatar = computed(() =>
    props.message.avatar ? imgRequestUrl(props.message.avatar) : defaultAvatar,
)

const senderName = computed(() =>
    props.message.senderUserId ? props.message.nickName || '未知用户' : '系统消息',
)

const videoCover = computed(() =>
    props.message.videoCover ? imgRequestUrl(props.message.videoCover) : '',
)

const mainContent = computed(() => props.message.extendJson?.mainContent || '')
const subContent = computed(() => props.message.extendJson?.subContent || '')
const hasExtendContent = computed(() => Boolean(mainContent.value || subContent.value))

const messageText = computed(() =>
{
    switch (props.message.messageType)
    {
        case MessageType.LIKE:
            return '点赞了你的视频'
        case MessageType.COLLECT:
            return '收藏了你的视频'
        case MessageType.COMMENT:
            if (subContent.value)
                return '回复了你的评论'
            else
                return '评论了你的视频'
        default:
            return ''
    }
})

function getContentElement(type: ExpandableContentType)
{
    return type === 'main' ? mainContentRef.value : subContentRef.value
}

function getContentExpanded(type: ExpandableContentType)
{
    return type === 'main' ? isMainContentExpanded.value : isSubContentExpanded.value
}

function setContentExpanded(type: ExpandableContentType, value: boolean)
{
    if (type === 'main')
    {
        isMainContentExpanded.value = value
        return
    }

    isSubContentExpanded.value = value
}

function setContentOverflowing(type: ExpandableContentType, value: boolean)
{
    if (type === 'main')
    {
        isMainContentOverflowing.value = value
        return
    }

    isSubContentOverflowing.value = value
}

async function updateContentOverflow(type?: ExpandableContentType)
{
    await nextTick()

    const contentTypes: ExpandableContentType[] = type ? [type] : ['main', 'sub']

    contentTypes.forEach((contentType) =>
    {
        const el = getContentElement(contentType)
        if (!el) return

        const previousWhiteSpace = el.style.whiteSpace
        const previousOverflow = el.style.overflow
        const previousTextOverflow = el.style.textOverflow

        if (getContentExpanded(contentType))
        {
            el.style.whiteSpace = 'nowrap'
            el.style.overflow = 'hidden'
            el.style.textOverflow = 'ellipsis'
        }

        const overflowing = el.scrollWidth > el.clientWidth + 1

        el.style.whiteSpace = previousWhiteSpace
        el.style.overflow = previousOverflow
        el.style.textOverflow = previousTextOverflow

        setContentOverflowing(contentType, overflowing)
        if (!overflowing) setContentExpanded(contentType, false)
    })
}

function toggleContentExpand(type: ExpandableContentType)
{
    const isOverflowing = type === 'main' ? isMainContentOverflowing.value : isSubContentOverflowing.value
    if (!isOverflowing && !getContentExpanded(type)) return

    setContentExpanded(type, !getContentExpanded(type))
    updateContentOverflow(type)
}

async function observeExtendContent()
{
    await nextTick()

    if (!resizeObserver) return

    if (mainContentRef.value) resizeObserver.observe(mainContentRef.value)
    if (subContentRef.value) resizeObserver.observe(subContentRef.value)
}

function resetExtendContentState()
{
    isMainContentExpanded.value = false
    isSubContentExpanded.value = false
    updateContentOverflow()
}

async function updateMessageOverflow()
{
    await nextTick()

    const el = messageTextRef.value
    if (!el) return

    el.title = messageText.value
}

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
    if (!props.message.senderUserId) return

    routerToNewPage(`/user/${props.message.senderUserId}`)
}

function goToVideo()
{
    if (!props.message.videoId) return

    routerToNewPage(`/video/${props.message.videoId}`)
}

onMounted(() =>
{
    updateMessageOverflow()
    updateContentOverflow()

    if (typeof ResizeObserver === 'undefined') return

    resizeObserver = new ResizeObserver(() =>
    {
        updateMessageOverflow()
        updateContentOverflow()
    })
    if (messageTextRef.value) resizeObserver.observe(messageTextRef.value)
    observeExtendContent()
})

onBeforeUnmount(() =>
{
    resizeObserver?.disconnect()
})

watch(messageText, () =>
{
    updateMessageOverflow()
})

watch(() => props.message.extendJson, () =>
{
    resetExtendContentState()
    observeExtendContent()
})
</script>

<template>
    <div :class="['message-item', { unread: message.readType === 0 }]">
        <div class="sender-section">
            <img :class="['avatar', { clickable: message.senderUserId }]" :src="senderAvatar" alt="avatar"
                @click="goToSenderHome">
            <div class="message-main">
                <div class="sender-row">
                    <div :class="['sender-name', { clickable: message.senderUserId }]" :title="senderName"
                        @click="goToSenderHome">
                        {{ senderName }}
                    </div>
                    <div v-if="messageText" ref="messageTextRef" class="message-text" :title="messageText">
                        {{ messageText }}
                    </div>
                </div>
                <div v-if="hasExtendContent" class="extend-content">
                    <div v-if="mainContent" ref="mainContentRef"
                        :class="['extend-content-text', { expanded: isMainContentExpanded, clickable: isMainContentOverflowing || isMainContentExpanded }]"
                        :title="mainContent" @click="toggleContentExpand('main')">
                        {{ mainContent }}
                    </div>
                    <div v-if="subContent" ref="subContentRef"
                        :class="['extend-content-text', 'sub-content', { expanded: isSubContentExpanded, clickable: isSubContentOverflowing || isSubContentExpanded }]"
                        :title="subContent" @click="toggleContentExpand('sub')">
                        {{ subContent }}
                    </div>
                </div>
                <div class="bottom-row">
                    <span class="create-time" :title="message.createTime || ''">
                        {{ message.createTime || '未知时间' }}
                    </span>
                    <el-tooltip content="删除消息" placement="top">
                        <button class="delete-button" @click.stop="onDelete">
                            <img :src="deleteSrc" alt="删除消息">
                        </button>
                    </el-tooltip>
                </div>
            </div>
        </div>
        <div :class="['video-section', { clickable: message.videoId }]" @click="goToVideo">
            <div class="cover">
                <img v-if="videoCover" :src="videoCover" alt="video cover">
            </div>
            <div class="video-name" :title="message.videoName || ''">{{ message.videoName || '无关联视频' }}</div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.message-item {
    display: flex;
    justify-content: space-between;
    column-gap: 20px;
    padding: 8px;
    border-radius: 8px;
    border: 1px solid $color-border;
    background-color: #fff;
    transition: background-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;

    &.unread {
        background-color: rgba(35, 173, 229, 0.14);
        border-color: rgba(35, 173, 229, 0.48);
    }

    &:hover {
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
        transform: translateY(-2px);
    }

    .sender-section {
        max-width: 80%;
        min-width: 0;
        flex: 1 1 70%;
        display: flex;
        column-gap: 14px;

        .avatar {
            width: 48px;
            height: 48px;
            flex: 0 0 48px;
            border-radius: 50%;
            object-fit: cover;
            background-color: $color-mask-10;

            &.clickable {
                cursor: pointer;
            }
        }

        .message-main {
            min-width: 0;
            flex: 1 1 auto;
            display: flex;
            flex-direction: column;
            row-gap: 8px;

            .sender-row {
                min-width: 0;
                display: flex;
                align-items: center;
                column-gap: 8px;

                .sender-name {
                    min-width: 0;
                    flex: 0 1 auto;
                    font-size: 16px;
                    font-weight: 600;
                    color: $color-text-primary;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;

                    &.clickable {
                        cursor: pointer;

                        &:hover {
                            color: $color-bilibili-blue;
                        }
                    }
                }

                .message-text {
                    min-width: 0;
                    flex: 1 1 auto;
                    color: $color-text-secondary;
                    font-size: 14px;
                    line-height: 20px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
            }

            .extend-content {
                min-width: 0;
                display: flex;
                flex-direction: column;
                row-gap: 6px;

                .extend-content-text {
                    min-width: 0;
                    color: $color-text-primary;
                    font-size: 14px;
                    line-height: 22px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;

                    &.clickable {
                        cursor: pointer;
                    }

                    &.expanded {
                        white-space: normal;
                        overflow: visible;
                        text-overflow: clip;
                        word-break: break-word;
                    }

                    &.sub-content {
                        padding: 8px 10px;
                        border-radius: 6px;
                        background-color: $color-mask-10;
                        color: $color-text-secondary;
                    }
                }
            }

            .bottom-row {
                margin-top: auto;
                display: flex;
                justify-content: space-between;
                align-items: center;
                column-gap: 12px;

                .create-time {
                    min-width: 0;
                    color: $color-text-muted;
                    font-size: 13px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .delete-button {
                    width: 28px;
                    height: 28px;
                    flex: 0 0 28px;
                    border: none;
                    border-radius: 50%;
                    background-color: transparent;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: background-color 0.2s ease;

                    img {
                        width: 16px;
                        height: 16px;
                        display: block;
                    }

                    &:hover {
                        background-color: $color-mask-10;
                    }
                }
            }
        }
    }

    .video-section {
        max-width: 10%;
        min-width: 0;
        flex: 0 1 28%;
        display: flex;
        flex-direction: column;
        row-gap: 8px;

        &.clickable {
            cursor: pointer;
        }

        .cover {
            width: 70%;
            aspect-ratio: 16 / 9;
            border-radius: 6px;
            overflow: hidden;
            background-color: $color-mask-10;

            img {
                width: 100%;
                object-fit: cover;
                display: block;
            }
        }

        .video-name {
            color: $color-text-primary;
            font-size: 14px;
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    }
}
</style>
