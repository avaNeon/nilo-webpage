<script lang="ts" setup>
import { computed, inject } from 'vue'
import SiteHeader from '@/shared/widgets/siteHeader/ui/SiteHeader.vue'
import HomeFooter from '@/pages/index/widgets/homeFooter/ui/HomeFooter.vue'
import MessageItem from '../entities/messageItem/ui/MessageItem.vue'
import { useMessageCenter } from '../composables/useMessageCenter'

// 获取内容部分最大最小宽度
const mainContentMaxWidth: number = inject('mainContentMaxWidth', 0)
const mainContentMinWidth: number = inject('mainContentMinWidth', 0)

/** 首屏骨架屏条数 */
const SKELETON_COUNT = 4

const {
    messageTypeItems,
    messages,
    currentMessageType,
    currentMessageTypeLabel,
    currentMessageTotalCount,
    totalUnreadCount,
    loading,
    finished,
    checkingAll,
    selectMessageType,
    deleteMessage,
    checkAllCurrentMessages,
    checkMessage,
    loadMessages,
} = useMessageCenter()

const unreadLabel = computed(() =>
{
    if (totalUnreadCount.value === null) return ''
    return totalUnreadCount.value > 0 ? `${totalUnreadCount.value} 条未读` : '全部已读'
})

function badgeText(count: number)
{
    return count > 99 ? '99+' : String(count)
}
</script>

<template>
    <div class="message-page warm-theme">
        <SiteHeader />
        <main class="message-main" :style="{
            'max-width': mainContentMaxWidth + 'px',
            'min-width': mainContentMinWidth + 'px',
        }">
            <div class="page-head">
                <h1>消息中心</h1>
                <span v-if="unreadLabel" class="head-sub">{{ unreadLabel }}</span>
            </div>

            <div class="message-layout">
                <!-- 左侧分类：选中白底蓝字，未读数角标 -->
                <aside class="type-list" aria-label="消息分类">
                    <button v-for="item in messageTypeItems" :key="item.value" type="button"
                        :class="['type-item', { active: item.value === currentMessageType }]"
                        :aria-current="item.value === currentMessageType ? 'page' : undefined"
                        @click="selectMessageType(item.value)">
                        {{ item.label }}
                        <span v-if="item.count" class="type-badge">{{ badgeText(item.count) }}</span>
                    </button>
                </aside>

                <section class="message-panel">
                    <div class="panel-head">
                        <div class="panel-title">
                            <span class="title">{{ currentMessageTypeLabel }}</span>
                            <span v-if="currentMessageTotalCount !== null" class="total">
                                共 {{ currentMessageTotalCount }} 条
                            </span>
                        </div>
                        <div class="panel-actions">
                            <span class="hint">点击消息可标记为已读</span>
                            <button type="button" class="read-all-button" :disabled="checkingAll"
                                @click="checkAllCurrentMessages">
                                {{ checkingAll ? '处理中…' : '全部已读' }}
                            </button>
                        </div>
                    </div>

                    <template v-if="loading && messages.length === 0">
                        <div v-for="n in SKELETON_COUNT" :key="n" class="skeleton-item" aria-hidden="true">
                            <span class="skeleton-block skeleton-avatar"></span>
                            <span class="skeleton-lines">
                                <span class="skeleton-block skeleton-name"></span>
                                <span class="skeleton-block skeleton-text"></span>
                                <span class="skeleton-block skeleton-time"></span>
                            </span>
                        </div>
                    </template>

                    <div v-else-if="messages.length === 0" class="empty">
                        <span class="empty-title">暂时没有{{ currentMessageTypeLabel }}</span>
                        <span class="empty-description">新的消息会第一时间出现在这里</span>
                    </div>

                    <template v-else>
                        <MessageItem v-for="message in messages"
                            :key="message.messageId ?? `${message.messageType}-${message.createTime}-${message.videoId}`"
                            :message="message" @click="checkMessage(message)" @delete="deleteMessage" />
                        <button v-if="!finished" type="button" class="load-more-button" :disabled="loading"
                            @click="loadMessages">
                            {{ loading ? '加载中…' : '加载更多' }}
                        </button>
                        <span v-else class="list-end">没有更多了</span>
                    </template>
                </section>
            </div>
        </main>
        <HomeFooter divider />
    </div>
</template>

<style lang="scss" scoped>
.message-page {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 100vh;

    button {
        padding: 0;
        border: none;
        background: none;
        font: inherit;
        color: inherit;
        cursor: pointer;

        &:focus-visible {
            outline: 2px solid $warm-accent;
            outline-offset: 2px;
        }

        &:disabled {
            cursor: not-allowed;
        }
    }
}

.message-main {
    flex: 1 0 auto;
    display: flex;
    flex-direction: column;
    gap: 32px;
    width: 100%;
    margin: 0 auto;
    padding: 40px 48px 104px;
}

.page-head {
    display: flex;
    align-items: baseline;
    gap: 16px;
    padding-bottom: 22px;
    border-bottom: 1px solid $warm-line;

    h1 {
        margin: 0;
        font-size: 34px;
        font-weight: 800;
        letter-spacing: -0.015em;
    }

    .head-sub {
        font-size: 13px;
        color: $warm-ink-4;
    }
}

.message-layout {
    display: grid;
    grid-template-columns: 232px minmax(0, 1fr);
    gap: 40px;
    align-items: start;
}

// 滚动时分类栏停在顶栏下面
.type-list {
    position: sticky;
    top: calc(#{$warm-header-height} + 24px);
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px;
    border-radius: 24px;
    background: $warm-sunken;
}

.message-page .type-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 48px;
    padding: 0 12px 0 18px;
    border-radius: 16px;
    color: $warm-ink-3;
    font-size: 14px;
    font-weight: 500;
    transition: background-color 0.2s, color 0.2s;

    &:hover {
        color: $warm-accent;
    }

    &:focus-visible {
        outline-offset: -2px;
    }

    // 未选中：白底蓝字；选中：蓝底白字
    .type-badge {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 22px;
        height: 22px;
        padding: 0 7px;
        border-radius: 999px;
        background: #FFFFFF;
        color: $warm-accent;
        font-size: 11px;
        font-weight: 600;
    }

    &.active {
        background: #FFFFFF;
        color: $warm-accent;
        font-weight: 700;

        .type-badge {
            background: $warm-accent;
            color: #FFFFFF;
        }
    }
}

.message-panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
}

.panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;

    .panel-title {
        display: flex;
        align-items: baseline;
        gap: 12px;
    }

    .title {
        font-size: 20px;
        font-weight: 800;
        letter-spacing: -0.01em;
    }

    .total {
        font-size: 13px;
        color: $warm-ink-4;
    }

    .panel-actions {
        display: flex;
        align-items: center;
        gap: 16px;
    }

    .hint {
        font-size: 12px;
        color: $warm-ink-4;
    }
}

.message-page .read-all-button {
    display: flex;
    align-items: center;
    height: 36px;
    padding: 0 16px;
    border-radius: 999px;
    background: $warm-accent-soft;
    color: $warm-accent;
    font-size: 13px;
    font-weight: 600;
    transition: background-color 0.2s, color 0.2s;

    &:hover:not(:disabled) {
        background: $warm-accent;
        color: #FFFFFF;
    }

    &:disabled {
        opacity: 0.6;
    }
}

.empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 96px 0;
    border-radius: 22px;
    background: $warm-sunken;

    .empty-title {
        font-size: 17px;
        font-weight: 700;
    }

    .empty-description {
        font-size: 13px;
        color: $warm-ink-4;
    }
}

.message-page .load-more-button {
    align-self: center;
    display: flex;
    align-items: center;
    height: 46px;
    margin-top: 12px;
    padding: 0 26px;
    border-radius: 999px;
    background: $warm-sunken;
    color: $warm-ink;
    font-size: 14px;
    font-weight: 600;
    transition: background-color 0.2s, color 0.2s;

    &:hover:not(:disabled) {
        background: $warm-accent;
        color: #FFFFFF;
    }
}

.list-end {
    align-self: center;
    margin-top: 12px;
    font-size: 12px;
    color: $warm-ink-5;
}

/*——————骨架屏：和消息卡片同样的头像 + 三行—————— */

.skeleton-item {
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr);
    gap: 18px;
    padding: 20px 20px 20px 22px;
    border-radius: 22px;
    box-shadow: $warm-shadow-ring;
}

.skeleton-block {
    display: block;
    border-radius: 6px;
    background: $warm-sunken;
}

.skeleton-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
}

.skeleton-lines {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-top: 4px;
}

.skeleton-name {
    width: 180px;
    height: 15px;
}

.skeleton-text {
    width: 62%;
    height: 14px;
}

.skeleton-time {
    width: 120px;
    height: 11px;
}

@media (prefers-reduced-motion: no-preference) {
    .skeleton-block {
        animation: skeleton-pulse 1.4s ease-in-out infinite;
    }
}

@keyframes skeleton-pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.55;
    }
}
</style>
