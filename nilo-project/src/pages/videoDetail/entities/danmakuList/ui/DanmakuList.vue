<script lang="ts" setup>
import { useDanmakuStore } from '@/pages/videoDetail/features/player/store/DanmakuStore';
import { calculateDuration, formatBackendDateTime } from '@/shared/utils/DateUtil';

const danmakuStore = useDanmakuStore()

function formatSendTime(time: string | undefined) {
    return formatBackendDateTime(time, 'YYYY-MM-DD');
}
</script>

<template>
    <div class="danmaku-list">
        <el-collapse class="collapse">
            <el-collapse-item class="collapse-item" name="1">
                <template #title>
                    <span class="card-title">
                        <span class="card-dot"></span>弹幕列表
                        <span class="card-count">{{ danmakuStore.danmakuList.length }}</span>
                    </span>
                </template>
                <el-table :data="danmakuStore.danmakuList" height="400" :show-header="true" class="danmaku-table"
                    size="small" empty-text="暂无弹幕">
                    <el-table-column label="时间" width="64" align="left" header-align="left">
                        <template #default="{ row }">
                            <span class="moment">{{ calculateDuration(Math.round(row.displayMoment / 1000)) }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="弹幕内容" min-width="150" show-overflow-tooltip align="left"
                        header-align="left">
                        <template #default="{ row }">
                            <span class="danmaku-content">{{ row.content }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="发送时间" width="92" align="right" header-align="right">
                        <template #default="{ row }">
                            <span class="post-time" :title="formatBackendDateTime(row.postTime) || ''">
                                {{ formatSendTime(row.postTime) }}
                            </span>
                        </template>
                    </el-table-column>
                </el-table>
            </el-collapse-item>
        </el-collapse>
    </div>
</template>

<style lang="scss" scoped>
// 侧栏卡片：白底圆角 + 细描边阴影
.collapse {
    --el-collapse-header-height: 52px;
    --el-collapse-header-font-size: 15px;
    --el-collapse-header-text-color: #{$warm-ink};
    --el-collapse-header-bg-color: #{$warm-card};
    --el-collapse-content-bg-color: #{$warm-card};
    --el-collapse-border-color: #{$warm-line};

    border: none;
    border-radius: 18px;
    background: $warm-card;
    box-shadow: $warm-shadow-ring;
    overflow: hidden;

    :deep(.el-collapse-item:last-child) {
        margin-bottom: 0;
    }

    :deep(.el-collapse-item__header) {
        padding: 0 18px;
        font-weight: 600;
    }

    :deep(.el-collapse-item__header.is-active) {
        border-bottom-color: $warm-line;
    }

    :deep(.el-collapse-item__arrow) {
        color: $warm-ink-4;
    }

    :deep(.el-collapse-item__wrap) {
        border-bottom: none;
    }

    :deep(.el-collapse-item__content) {
        padding-bottom: 0;
    }

    .card-title {
        display: inline-flex;
        align-items: center;
        gap: 10px;
    }

    .card-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        flex-shrink: 0;
        background: $warm-accent;
    }

    .card-count {
        margin-left: -4px;
        font-size: 13px;
        font-weight: 500;
        color: $warm-ink-4;
    }
}

.danmaku-table {
    --el-table-bg-color: #{$warm-card};
    --el-table-tr-bg-color: #{$warm-card};
    --el-table-header-bg-color: #{$warm-card};
    --el-table-row-hover-bg-color: #{$warm-paper};
    --el-table-border-color: #{$warm-line-soft};
    --el-table-border: 1px solid #{$warm-line-soft};
    --el-table-text-color: #{$warm-ink-2};
    --el-table-header-text-color: #{$warm-ink-4};

    padding: 0 8px;
    font-size: 12px;

    :deep(.el-table__inner-wrapper::before) {
        display: none;
    }

    :deep(th.el-table__cell) {
        font-size: 12px;
        font-weight: 500;
    }

    // 行与行之间不画分隔线，悬停整行变浅底
    :deep(td.el-table__cell) {
        border-bottom: none;
    }

    :deep(.el-table__body tr.hover-row > td.el-table__cell),
    :deep(.el-table__body tr:hover > td.el-table__cell) {
        background-color: $warm-paper;
    }

    :deep(.el-table__empty-text) {
        font-size: 13px;
        color: $warm-ink-4;
    }

    .moment {
        font-family: $warm-font-mono;
        color: $warm-ink-4;
    }

    .danmaku-content {
        font-size: 13px;
        color: $warm-ink;
    }

    .post-time {
        color: $warm-ink-4;
    }
}
</style>
