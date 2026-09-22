<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue'
import { ChatDotRound, Close, Promotion, RefreshRight, VideoPlay } from '@element-plus/icons-vue'
import { calculateDuration } from '@/shared/utils/DateUtil'
import type { AiCitedSegment } from '../model/AiAnswer'
import { QUESTION_MAX_LENGTH, useAiAssistant } from '../model/useAiAssistant'

const props = withDefaults(defineProps<{
    /** 视频详情页传当前视频 id：提问时带给后端，这个视频的片段点击后在本页跳转 */
    videoId?: string,
    /**
     * false: 首页形态，右下角悬浮球 + 弹出面板
     * true: 嵌在父容器里，没有悬浮球，面板一直展开（视频详情页用，悬浮球会被播放器的迷你窗挡住）
     */
    embedded?: boolean,
}>(), {
    embedded: false,
})

const emit = defineEmits<{
    /** 点了当前视频的片段，怎么跳由使用方决定 */
    jump: [payload: { fileIndex: number; startSec: number }]
}>()

const { visible, messages, input, sending, toggle, reset, send } = useAiAssistant(() => props.videoId)

/** 嵌入形态一直显示面板 */
const panelVisible = computed(() => props.embedded || visible.value)

const placeholder = computed(() =>
    props.videoId ? '问问这个视频，比如：某个内容在第几分钟讲的' : '想看什么？比如：有没有讲多线程的视频')

/** 消息列表容器，用来滚到最底部 */
const messageListRef = ref<HTMLElement | null>(null)

// 有新消息、开始等待回答、刚展开对话框时，都滚到最底部
watch([
    () => messages.value.length,
    () => messages.value[messages.value.length - 1]?.content,
    () => messages.value[messages.value.length - 1]?.pending,
    sending,
    visible,
], async () =>
{
    await nextTick()
    const el = messageListRef.value
    if (el)
    {
        el.scrollTop = el.scrollHeight
    }
})

/** Enter 发送，Shift + Enter 换行；输入法选词时按的 Enter 不算 */
function onKeydown(event: Event | KeyboardEvent)
{
    const keyEvent = event as KeyboardEvent
    if (keyEvent.key === 'Enter' && !keyEvent.shiftKey && !keyEvent.isComposing)
    {
        keyEvent.preventDefault()
        send()
    }
}

/** 片段标签文字，例如「P2 5:29」 */
function segmentLabel(segment: AiCitedSegment)
{
    return `P${segment.fileIndex} ${calculateDuration(Math.floor(segment.startSec))}`
}

/** 同一个视频会引用多个片段，key 要带上分 P 和时间 */
function segmentKey(segment: AiCitedSegment)
{
    return `${segment.videoId}-${segment.fileIndex}-${segment.startSec}`
}

/** 别的视频的片段：播放页读 t 参数跳到对应时间 */
function segmentLink(segment: AiCitedSegment)
{
    return `/video/${segment.videoId}/${segment.fileIndex}?t=${Math.floor(segment.startSec)}`
}

/** 当前视频的片段：交给使用方跳转进度，不刷新页面 */
function onSegmentClick(segment: AiCitedSegment)
{
    emit('jump', { fileIndex: segment.fileIndex, startSec: segment.startSec })
}
</script>

<template>
    <div :class="['ai-assistant', { embedded }]">
        <transition name="ai-panel">
            <div v-show="panelVisible" class="panel">
                <div class="panel-header">
                    <span class="title">Nilo 视频助手</span>
                    <div class="actions">
                        <el-tooltip content="新对话" placement="top">
                            <el-icon class="action" @click="reset">
                                <RefreshRight />
                            </el-icon>
                        </el-tooltip>
                        <el-icon v-if="!embedded" class="action" @click="toggle">
                            <Close />
                        </el-icon>
                    </div>
                </div>

                <div ref="messageListRef" class="message-list">
                    <div v-for="(message, index) in messages" :key="index" :class="['message', message.role]">
                        <div class="bubble" :class="{ thinking: !message.content && message.pending }">
                            {{ message.content || message.pending }}
                        </div>
                        <div v-if="message.segments?.length" class="segments">
                            <template v-for="segment in message.segments" :key="segmentKey(segment)">
                                <!-- 当前视频的片段：本页跳转进度 -->
                                <button v-if="segment.videoId === props.videoId" type="button" class="segment-tag"
                                    :title="segment.videoName" @click="onSegmentClick(segment)">
                                    <el-icon>
                                        <VideoPlay />
                                    </el-icon>
                                    <span>{{ segmentLabel(segment) }}</span>
                                </button>
                                <!-- 别的视频的片段：新标签页打开（同一标签页换视频时详情页组件会被复用，视频信息不会重新加载） -->
                                <RouterLink v-else class="segment-tag" :to="segmentLink(segment)" target="_blank"
                                    :title="segment.videoName">
                                    <el-icon>
                                        <VideoPlay />
                                    </el-icon>
                                    <span>{{ segmentLabel(segment) }}</span>
                                    <span class="segment-video-name">{{ segment.videoName }}</span>
                                </RouterLink>
                            </template>
                        </div>
                        <div v-if="message.videos?.length" class="videos">
                            <RouterLink v-for="video in message.videos" :key="video.videoId" class="video-link"
                                :to="`/video/${video.videoId}`" target="_blank">
                                <el-icon>
                                    <VideoPlay />
                                </el-icon>
                                <span>{{ video.videoName }}</span>
                            </RouterLink>
                        </div>
                    </div>
                </div>

                <div class="input-bar">
                    <el-input v-model="input" type="textarea" :autosize="{ minRows: 1, maxRows: 4 }" resize="none"
                        :maxlength="QUESTION_MAX_LENGTH" :placeholder="placeholder" @keydown="onKeydown" />
                    <el-button type="primary" :icon="Promotion" circle :disabled="!input.trim() || sending"
                        @click="send" />
                </div>
            </div>
        </transition>

        <div v-if="!embedded" class="trigger" @click="toggle">
            <el-icon :size="26">
                <ChatDotRound />
            </el-icon>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.ai-assistant {
    position: fixed;
    right: 24px;
    bottom: 24px;
    z-index: 1000;

    .trigger {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        background-color: $color-bilibili-blue;
        box-shadow: 0 4px 12px $color-mask-20;
        cursor: pointer;
        transition: transform 0.2s ease;

        &:hover {
            transform: scale(1.08);
        }
    }

    .panel {
        position: absolute;
        right: 0;
        bottom: 68px;
        width: 460px;
        height: 520px;
        display: flex;
        flex-direction: column;
        background-color: #fff;
        border-radius: 12px;
        box-shadow: 0 8px 24px $color-mask-20;
        overflow: hidden;
    }

    .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid $color-border;

        .title {
            font-weight: 600;
            color: $color-text-primary;
        }

        .actions {
            display: flex;
            gap: 12px;
        }

        .action {
            color: $color-text-secondary;
            cursor: pointer;

            &:hover {
                color: $color-bilibili-blue;
            }
        }
    }

    .message-list {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 12px 16px;
        overflow-y: auto;
    }

    .message {
        display: flex;
        flex-direction: column;
        max-width: 85%;

        .bubble {
            padding: 8px 12px;
            border-radius: 10px;
            font-size: 14px;
            line-height: 1.6;
            white-space: pre-wrap;
            word-break: break-word;
        }

        &.user {
            align-self: flex-end;
            align-items: flex-end;

            .bubble {
                color: #fff;
                background-color: $color-bilibili-blue;
            }
        }

        &.assistant {
            align-self: flex-start;
            align-items: flex-start;

            .bubble {
                color: $color-text-primary;
                background-color: $color-surface;
            }
        }

        .thinking {
            color: $color-text-muted !important;
        }

        .segments {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            max-width: 100%;
            margin-top: 6px;
        }

        .segment-tag {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            max-width: 100%;
            padding: 2px 8px;
            border: none;
            border-radius: 12px;
            font-family: inherit;
            font-size: 12px;
            line-height: 20px;
            color: $color-link;
            background-color: rgba($color-link, 0.08);
            text-decoration: none;
            cursor: pointer;

            &:hover {
                background-color: rgba($color-link, 0.16);
            }

            .segment-video-name {
                min-width: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                color: $color-text-secondary;
            }
        }

        .videos {
            display: flex;
            flex-direction: column;
            gap: 4px;
            margin-top: 6px;
        }

        .video-link {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 13px;
            color: $color-link;
            text-decoration: none;

            &:hover {
                text-decoration: underline;
            }
        }
    }

    .input-bar {
        display: flex;
        align-items: flex-end;
        gap: 8px;
        padding: 12px 16px;
        border-top: 1px solid $color-border;
    }

    // 嵌入形态：跟着父容器走，不浮在页面上
    &.embedded {
        position: static;
        z-index: auto;

        .panel {
            position: static;
            width: 100%;
            height: 420px;
            border-radius: 0;
            box-shadow: none;
        }
    }
}

.ai-panel-enter-active,
.ai-panel-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.ai-panel-enter-from,
.ai-panel-leave-to {
    opacity: 0;
    transform: translateY(12px);
}
</style>
