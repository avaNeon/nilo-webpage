<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue'
import { ChatDotRound, Close, RefreshRight, VideoPlay } from '@element-plus/icons-vue'
import { calculateDuration } from '@/shared/utils/DateUtil'
import type { AiCitedSegment } from '../model/AiAnswer'
import { QUESTION_MAX_LENGTH, useAiAssistant } from '../model/useAiAssistant'

const props = withDefaults(defineProps<{
    /** 视频详情页传当前视频 id：提问时带给后端，这个视频的片段点击后在本页跳转 */
    videoId?: string,
    /**
     * false: 右下角悬浮球 + 弹出面板
     * true: 嵌在父容器里，没有悬浮球（首页顶栏的「AI 搜索」弹层、视频详情页侧栏卡片）
     */
    embedded?: boolean,
    /** 面板标题 */
    title?: string,
    /** 标题后面的灰色说明 */
    subtitle?: string,
    /** 嵌入形态下显示关闭按钮，点了发 close */
    closable?: boolean,
    /** 嵌入形态下点标题栏折叠 / 展开对话，默认收起 */
    collapsible?: boolean,
    /** 还没提问时展示的示例问题，点一下就发出去。首页搜索用，视频页不传 */
    suggestions?: string[],
}>(), {
    embedded: false,
    title: 'Nilo 视频助手',
    subtitle: '',
    closable: false,
    collapsible: false,
    suggestions: () => [],
})

const emit = defineEmits<{
    /** 点了当前视频的片段，怎么跳由使用方决定 */
    jump: [payload: { fileIndex: number; startSec: number }]
    /** 嵌入形态点了关闭 */
    close: []
}>()

const { visible, messages, input, sending, quota, toggle, reset, send, ask } = useAiAssistant(() => props.videoId)

/** 只有开场白时才提示可以怎么问，发出去之后就收起来 */
const showSuggestions = computed(() =>
    props.suggestions.length > 0 && messages.value.length === 1 && !sending.value)

/** 嵌入形态一直显示面板 */
const panelVisible = computed(() => props.embedded || visible.value)

const isCollapsible = computed(() => props.embedded && props.collapsible)

/** 对话区：可折叠时跟着展开状态走，否则一直显示 */
const bodyVisible = computed(() => !isCollapsible.value || visible.value)

const showCloseButton = computed(() => !props.embedded || props.closable)

function onHeaderClick()
{
    if (isCollapsible.value)
    {
        toggle()
    }
}

function close()
{
    if (props.embedded)
    {
        emit('close')
    }
    else
    {
        toggle()
    }
}

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
    <div :class="['ai-assistant', { embedded, collapsible: isCollapsible, open: bodyVisible }]">
        <transition name="ai-panel">
            <div v-show="panelVisible" class="panel">
                <div class="panel-header" :role="isCollapsible ? 'button' : undefined"
                    :tabindex="isCollapsible ? 0 : undefined" :aria-expanded="isCollapsible ? bodyVisible : undefined"
                    @click="onHeaderClick" @keydown.enter.self.prevent="onHeaderClick"
                    @keydown.space.self.prevent="onHeaderClick">
                    <span class="mark" aria-hidden="true"></span>
                    <span class="title">{{ title }}</span>
                    <span v-if="subtitle" class="subtitle">{{ subtitle }}</span>
                    <span class="spacer"></span>
                    <span v-if="quota" class="quota" :title="`今天还能问 ${quota.limit - quota.used} 次`">今日 {{ quota.used }}/{{ quota.limit }}</span>
                    <button v-show="bodyVisible" type="button" class="icon-button" title="新对话" aria-label="新对话"
                        @click.stop="reset">
                        <el-icon :size="15">
                            <RefreshRight />
                        </el-icon>
                    </button>
                    <button v-if="showCloseButton" type="button" class="icon-button" aria-label="关闭"
                        @click.stop="close">
                        <el-icon :size="16">
                            <Close />
                        </el-icon>
                    </button>
                    <span v-if="isCollapsible" class="chevron" aria-hidden="true"></span>
                </div>

                <div v-show="bodyVisible" class="panel-body">
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
                                        <span class="segment-time">{{ segmentLabel(segment) }}</span>
                                    </button>
                                    <!-- 别的视频的片段：新标签页打开（同一标签页换视频时详情页组件会被复用，视频信息不会重新加载） -->
                                    <RouterLink v-else class="segment-tag" :to="segmentLink(segment)" target="_blank"
                                        :title="segment.videoName">
                                        <el-icon>
                                            <VideoPlay />
                                        </el-icon>
                                        <span class="segment-time">{{ segmentLabel(segment) }}</span>
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

                    <div v-if="showSuggestions" class="suggestions">
                        <span class="suggestions-label">可以这样问</span>
                        <button v-for="item in suggestions" :key="item" type="button" class="suggestion"
                            @click="ask(item)">
                            {{ item }}
                        </button>
                    </div>

                    <div class="input-bar">
                        <el-input v-model="input" type="textarea" :autosize="{ minRows: 1, maxRows: 4 }" resize="none"
                            :maxlength="QUESTION_MAX_LENGTH" :placeholder="placeholder" @keydown="onKeydown" />
                        <button type="button" class="send-button" aria-label="发送" :disabled="!input.trim() || sending"
                            @click="send">
                            <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
                                <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" fill="none" stroke="currentColor"
                                    stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                        </button>
                    </div>
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
    font-family: $warm-font-sans;
    color: $warm-ink;

    button {
        padding: 0;
        border: none;
        background: transparent;
        font: inherit;
        color: inherit;
        cursor: pointer;
    }

    .trigger {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #FFFFFF;
        background-color: $warm-accent;
        box-shadow: 0 12px 28px -12px rgba(0, 0, 242, 0.6);
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
        width: 452px;
        height: 540px;
        display: flex;
        flex-direction: column;
        border-radius: 26px;
        background: #FFFFFF;
        box-shadow: $warm-shadow-card;
        overflow: hidden;
    }

    /*——————标题栏—————— */

    .panel-header {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        gap: 10px;
        height: 60px;
        padding: 0 12px 0 20px;
        border-bottom: 1px solid $warm-line-soft;
    }

    // 蓝色圆点标记：大圆里偏右上一个白点
    .mark {
        position: relative;
        flex-shrink: 0;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: $warm-accent;

        &::after {
            content: '';
            position: absolute;
            left: 12px;
            top: 5px;
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: #FFFFFF;
        }
    }

    .title {
        flex-shrink: 0;
        font-size: 15px;
        font-weight: 700;
    }

    .subtitle {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 12px;
        color: $warm-ink-4;
    }

    .quota {
        flex-shrink: 0;
        font-size: 12px;
        color: $warm-ink-4;
    }

    .spacer {
        flex: 1;
    }

    .icon-button {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        color: $warm-ink-3;
        transition: background-color 0.2s, color 0.2s;

        &:hover {
            background: $warm-sunken;
            color: $warm-ink;
        }

        &:focus-visible {
            outline: 2px solid $warm-accent;
            outline-offset: -2px;
        }
    }

    .chevron {
        flex-shrink: 0;
        width: 8px;
        height: 8px;
        margin: 0 8px 0 6px;
        border-right: 1.5px solid $warm-ink-3;
        border-bottom: 1.5px solid $warm-ink-3;
        transform: translateY(2px) rotate(-135deg);
        transition: transform 0.2s;
    }

    &.open .chevron {
        transform: translateY(-2px) rotate(45deg);
    }

    /*——————对话区—————— */

    .panel-body {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 18px 16px 16px;
    }

    .message-list {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
        overflow-y: auto;
    }

    .suggestions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
    }

    .suggestions-label {
        flex-shrink: 0;
        font-size: 12px;
        color: $warm-ink-4;
    }

    .suggestion {
        max-width: 100%;
        height: 30px;
        padding: 0 12px;
        border-radius: 999px;
        background: $warm-accent-soft;
        font-size: 12px;
        font-weight: 500;
        color: $warm-accent;
        white-space: nowrap;
        transition: background-color 0.2s;

        &:hover {
            background: rgba(0, 0, 242, 0.12);
        }

        &:focus-visible {
            outline: 2px solid $warm-accent;
            outline-offset: 2px;
        }
    }

    .message {
        display: flex;
        flex-direction: column;
        max-width: 88%;

        .bubble {
            font-size: 14px;
            white-space: pre-wrap;
            word-break: break-word;
        }

        &.user {
            align-self: flex-end;
            align-items: flex-end;

            .bubble {
                padding: 10px 14px;
                border-radius: 18px 18px 6px 18px;
                line-height: 1.6;
                color: #FFFFFF;
                background-color: $warm-accent;
            }
        }

        &.assistant {
            align-self: flex-start;
            align-items: flex-start;

            .bubble {
                padding: 12px 14px;
                border-radius: 18px 18px 18px 6px;
                line-height: 1.75;
                color: $warm-ink-2;
                background-color: $warm-sunken;
            }
        }

        .thinking {
            color: $warm-ink-4 !important;
        }

        .segments {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            max-width: 100%;
            margin-top: 8px;
        }

        .segment-tag {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            max-width: 100%;
            height: 30px;
            padding: 0 12px;
            border-radius: 999px;
            box-shadow: inset 0 0 0 1px rgba(0, 0, 242, 0.25);
            font-size: 12px;
            font-weight: 500;
            color: $warm-accent;
            text-decoration: none;
            cursor: pointer;
            transition: background-color 0.2s;

            &:hover {
                background-color: $warm-accent-soft;
            }

            .segment-time {
                flex-shrink: 0;
                font-family: $warm-font-mono;
            }

            .segment-video-name {
                min-width: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                color: $warm-ink-3;
            }
        }

        .videos {
            display: flex;
            flex-direction: column;
            gap: 4px;
            margin-top: 8px;
        }

        .video-link {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            font-weight: 500;
            color: $warm-accent;
            text-decoration: none;

            &:hover {
                text-decoration: underline;
                text-underline-offset: 3px;
            }
        }
    }

    // 输入框：浅灰胶囊，右侧蓝色圆形发送键
    .input-bar {
        flex-shrink: 0;
        display: flex;
        align-items: flex-end;
        gap: 8px;
        min-height: 46px;
        padding: 5px 5px 5px 16px;
        border-radius: 23px;
        background: $warm-sunken;

        :deep(.el-textarea__inner) {
            padding: 7px 0;
            border: none;
            background: transparent;
            box-shadow: none;
            font-size: 13px;
            line-height: 22px;
            color: $warm-ink;

            &::placeholder {
                color: $warm-ink-4;
            }
        }
    }

    .send-button {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: $warm-accent;
        color: #FFFFFF;
        transition: opacity 0.2s, background-color 0.2s;

        &:hover:not(:disabled) {
            background: $warm-ink;
        }

        &:disabled {
            opacity: 0.35;
            cursor: default;
        }
    }

    // 嵌入形态：跟着父容器走，不浮在页面上；圆角和描边由父容器负责
    &.embedded {
        position: static;
        z-index: auto;

        .panel {
            position: static;
            width: 100%;
            height: auto;
            border-radius: 0;
            background: transparent;
            box-shadow: none;
            overflow: visible;
        }

        .message-list {
            flex: none;
            max-height: var(--ai-message-max-height, 360px);
        }
    }

    // 可折叠：标题栏可点，收起时去掉分隔线
    &.collapsible {
        .panel-header {
            cursor: pointer;
            border-radius: inherit;

            &:focus-visible {
                outline: 2px solid $warm-accent;
                outline-offset: -2px;
            }
        }

        &:not(.open) .panel-header {
            border-bottom-color: transparent;
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
