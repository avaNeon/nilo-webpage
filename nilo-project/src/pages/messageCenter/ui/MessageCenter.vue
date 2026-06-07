<script lang="ts" setup>
import { inject } from 'vue'
import IndexHeader from '@/shared/widgets/indexHeader/ui/IndexHeader.vue'
import defaultBg from '@/assets/banner-background-beach.jpg'
import { BODY_PADDING } from '@/shared/config/Config'
import MessageItem from '../entities/messageItem/ui/MessageItem.vue'
import { useMessageCenter } from '../composables/useMessageCenter'

// 获取内容部分最大最小宽度
const mainContentMaxWidth: number = inject('mainContentMaxWidth', 0)
const mainContentMinWidth: number = inject('mainContentMinWidth', 0)

const {
    messageTypeItems,
    messages,
    currentMessageType,
    currentMessageTotalCount,
    loading,
    finished,
    checkingAll,
    selectMessageType,
    handleMessagePanelScroll,
    deleteMessage,
    checkAllCurrentMessages,
    checkMessage,
    loadMessages,
} = useMessageCenter()
</script>

<template>
    <div class="page-content" :style="{
        'max-width': mainContentMaxWidth + 'px',
        'min-width': mainContentMinWidth + 'px',
    }">
        <header>
            <div class="header" :style="{
                'background-image': `url(${defaultBg})`
            }">
                <IndexHeader />
            </div>
        </header>
        <div class="content" :style="{
            'margin-left': BODY_PADDING,
            'margin-right': BODY_PADDING,
        }">
            <div class="page-title">消息中心</div>
            <div class="message-layout">
                <aside class="message-type-list">
                    <button v-for="item in messageTypeItems" :key="item.value"
                        :class="['message-type-item', { active: item.value === currentMessageType }]"
                        @click="selectMessageType(item.value)">
                        <span class="message-type-label">{{ item.label }}</span>
                        <span v-if="item.count !== null && item.count !== 0" class="message-type-count">
                            {{ item.count }}
                        </span>
                    </button>
                </aside>
                <section class="message-panel" @scroll="handleMessagePanelScroll">
                    <div class="message-panel-header">
                        <span class="message-total-count">共{{ currentMessageTotalCount ?? 0 }}条消息</span>
                        <div class="message-panel-header-right">
                            <span class="hint-text">点击消息可标记为已读</span>
                            <button class="check-all-button" type="button" :disabled="checkingAll"
                                @click="checkAllCurrentMessages">
                                {{ checkingAll ? '处理中...' : '全部已读' }}
                            </button>
                        </div>
                    </div>
                    <MessageItem v-for="message in messages"
                        :key="message.messageId ?? `${message.messageType}-${message.createTime}-${message.videoId}`"
                        :message="message" @click="checkMessage(message)" @delete="deleteMessage" />
                    <el-empty v-if="!loading && messages.length === 0" description="暂无消息" />
                    <div v-if="messages.length > 0" class="load-more" @click="loadMessages">
                        {{ loading ? '加载中...' : finished ? '没有更多了' : '点击加载更多' }}
                    </div>
                </section>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.page-content {
    position: relative;
    height: 100vh;
    overflow: hidden;
    background-color: white;
    margin: 0 auto;

    header {
        width: 100%;
        position: relative;

        .header {
            height: 150px;
            background: no-repeat center;
            background-size: cover;
        }
    }

    .content {
        background-color: white;
        height: calc(100vh - 130px);
        box-sizing: border-box;
        padding: 28px 0 48px;
        display: flex;
        flex-direction: column;
        min-height: 0;

        .page-title {
            margin-bottom: 24px;
            font-size: 24px;
            font-weight: 600;
            color: $color-text-primary;
        }

        .message-layout {
            flex: 1 1 auto;
            min-height: 0;
            display: flex;
            align-items: flex-start;
            column-gap: 24px;

            .message-type-list {
                width: 180px;
                flex: 0 0 180px;
                display: flex;
                flex-direction: column;
                row-gap: 8px;
                padding: 8px;
                border-radius: 8px;
                background-color: rgba(0, 0, 0, 0.04);

                .message-type-item {
                    height: 42px;
                    border: none;
                    border-radius: 6px;
                    background-color: transparent;
                    color: $color-text-secondary;
                    font-size: 15px;
                    font-weight: 500;
                    text-align: left;
                    padding: 0 14px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    column-gap: 10px;
                    cursor: pointer;
                    transition: background-color 0.2s ease, color 0.2s ease;

                    .message-type-label {
                        min-width: 0;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }

                    .message-type-count {
                        min-width: 24px;
                        height: 20px;
                        flex: 0 0 auto;
                        border-radius: 10px;
                        padding: 0 7px;
                        box-sizing: border-box;
                        background-color: $color-mask-10;
                        color: $color-text-muted;
                        font-size: 12px;
                        line-height: 20px;
                        text-align: center;
                    }

                    &:hover,
                    &.active {
                        color: $color-bilibili-blue;
                        background-color: rgba(35, 173, 229, 0.1);

                        .message-type-count {
                            background-color: rgba(35, 173, 229, 0.14);
                            color: $color-bilibili-blue;
                        }
                    }
                }
            }

            .message-panel {
                min-width: 0;
                height: 100%;
                flex: 1 1 auto;
                display: flex;
                flex-direction: column;
                row-gap: 14px;
                overflow-y: auto;
                padding-right: 8px;

                .message-panel-header {
                    min-height: 36px;
                    flex: 0 0 auto;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    column-gap: 16px;

                    .message-total-count {
                        color: $color-text-secondary;
                        font-size: 14px;
                        font-weight: 500;
                    }

                    .message-panel-header-right {
                        display: flex;
                        align-items: center;
                        column-gap: 20px;

                        .hint-text {
                            font-size: 14px;
                        }

                        .check-all-button {
                            border: none;
                            border-radius: 6px;
                            padding: 0 14px;
                            height: 32px;
                            background-color: rgba(35, 173, 229, 0.1);
                            color: $color-bilibili-blue;
                            font-size: 14px;
                            font-weight: 500;
                            cursor: pointer;
                            transition: background-color 0.2s ease, color 0.2s ease;

                            &:hover:not(:disabled) {
                                background-color: rgba(35, 173, 229, 0.16);
                            }

                            &:disabled {
                                cursor: not-allowed;
                                color: $color-text-muted;
                                background-color: $color-mask-10;
                            }
                        }
                    }

                }

                .load-more {
                    flex: 0 0 auto;
                    text-align: center;
                    color: $color-text-muted;
                    font-size: 14px;
                    padding: 12px 0 4px;
                    cursor: pointer;
                }
            }
        }
    }
}
</style>
