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
            <el-collapse-item class="collapse-item" title="弹幕列表" name="1">
                <el-table :data="danmakuStore.danmakuList" height="400" :show-header="true" class="danmaku-table"
                    size="small">
                    <el-table-column label="时间" width="70" align="center" header-align="center">
                        <template #default="{ row }">
                            {{ calculateDuration(Math.round(row.displayMoment / 1000)) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="弹幕内容" min-width="150" show-overflow-tooltip align="center"
                        header-align="center">
                        <template #default="{ row }">
                            <span class="danmaku-content">{{ row.content }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="发送时间" width="120" align="center" header-align="center">
                        <template #default="{ row }">
                            <span class="post-time" :title="row.postTime">
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
.collapse {
    border-radius: 10px;
    overflow: hidden;

    :deep(.el-collapse-item__header) {
        background-color: #f5f5f5;
        font-size: 16px;
        padding-left: 15px;
    }

    :deep(.el-collapse-item__wrap) {
        background-color: #f5f5f5;
        padding: 0;
    }

    :deep(.el-collapse-item__content) {
        padding-bottom: 0;
    }
}

.danmaku-table {
    background-color: transparent;

    :deep(.el-table__inner-wrapper::before) {
        display: none;
    }

    :deep(tr),
    :deep(th.el-table__cell) {
        background-color: transparent;
    }

    .danmaku-content {
        color: #333;
    }
}
</style>