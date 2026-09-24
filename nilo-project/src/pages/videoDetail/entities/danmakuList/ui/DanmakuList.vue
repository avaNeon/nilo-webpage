<script lang="ts" setup>
import { ref } from 'vue';
import { useDanmakuStore } from '@/pages/videoDetail/features/player/store/DanmakuStore';
import { calculateDuration, formatBackendDateTime } from '@/shared/utils/DateUtil';
import { formatCount } from '@/shared/utils/NumberUtil';

const danmakuStore = useDanmakuStore()

// 默认收起：弹幕多的视频一展开就是几千行
const open = ref(false)

function formatSendTime(time: string | undefined) {
    return formatBackendDateTime(time, 'MM-DD HH:mm');
}
</script>

<template>
    <div :class="['danmaku-list', { open }]">
        <button type="button" class="card-header" :aria-expanded="open" @click="open = !open">
            <span class="card-title">弹幕列表</span>
            <span class="card-count">{{ formatCount(danmakuStore.danmakuList.length) }} 条</span>
            <span class="spacer"></span>
            <span class="chevron" aria-hidden="true"></span>
        </button>
        <div v-if="open" class="card-body">
            <div class="table-row table-head">
                <span>时间</span>
                <span>内容</span>
                <span class="align-right">发送于</span>
            </div>
            <div class="table-body">
                <div v-for="(danmaku, index) in danmakuStore.danmakuList" :key="danmaku.danmakuId ?? index"
                    class="table-row">
                    <span class="moment">{{ calculateDuration(Math.round(danmaku.displayMoment / 1000)) }}</span>
                    <span class="content" :title="danmaku.content">{{ danmaku.content }}</span>
                    <span class="post-time align-right" :title="formatBackendDateTime(danmaku.postTime) || ''">
                        {{ formatSendTime(danmaku.postTime) }}
                    </span>
                </div>
                <div v-if="danmakuStore.danmakuList.length === 0" class="empty">暂无弹幕</div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
// 侧栏卡片：白底圆角 + 内描边
.danmaku-list {
    border-radius: 24px;
    background: $warm-card;
    box-shadow: $warm-shadow-ring;
}

.card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    height: 60px;
    padding: 0 20px;
    border: none;
    border-radius: 24px;
    background: transparent;
    font: inherit;
    color: $warm-ink;
    cursor: pointer;

    &:focus-visible {
        outline: 2px solid $warm-accent;
        outline-offset: -2px;
    }

    .card-title {
        font-size: 15px;
        font-weight: 700;
    }

    .card-count {
        font-size: 12px;
        color: $warm-ink-4;
    }

    .spacer {
        flex: 1;
    }

    .chevron {
        width: 8px;
        height: 8px;
        margin-right: 2px;
        border-right: 1.5px solid $warm-ink-3;
        border-bottom: 1.5px solid $warm-ink-3;
        transform: translateY(2px) rotate(-135deg);
        transition: transform 0.2s;
    }
}

.open .card-header .chevron {
    transform: translateY(-2px) rotate(45deg);
}

.card-body {
    padding-bottom: 12px;
}

// 三列：时间 / 内容 / 发送时间
.table-row {
    display: grid;
    grid-template-columns: 52px minmax(0, 1fr) 76px;
    gap: 10px;
    align-items: center;
}

.table-head {
    padding: 8px 20px;
    border-top: 1px solid $warm-line-soft;
    border-bottom: 1px solid $warm-line-soft;
    font-size: 11px;
    color: $warm-ink-4;
}

.table-body {
    max-height: 320px;
    padding: 4px 8px 0;
    overflow-y: auto;

    .table-row {
        height: 38px;
        padding: 0 12px;
        border-radius: 10px;
        transition: background-color 0.15s;

        &:hover {
            background: $warm-sunken;
        }
    }
}

.moment {
    font-family: $warm-font-mono;
    font-size: 12px;
    color: $warm-accent;
}

.content {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    color: $warm-ink-2;
}

.post-time {
    font-size: 11px;
    color: $warm-ink-4;
    white-space: nowrap;
}

.align-right {
    text-align: right;
}

.empty {
    padding: 20px 0 12px;
    font-size: 13px;
    color: $warm-ink-4;
    text-align: center;
}
</style>
