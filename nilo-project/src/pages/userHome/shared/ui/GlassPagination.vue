<script lang="ts" setup>
defineProps<{
    total: number,
    pageSize: number,
    currentPage: number,
}>()

const emit = defineEmits<{
    (e: 'change', pageNo: number): void,
}>()
</script>

<template>
    <!-- 白雾胶囊里的圆形页码，当前页墨色 -->
    <div class="glass-pagination">
        <el-pagination layout="prev, pager, next" prev-text="←" next-text="→" :total="total" :page-size="pageSize"
            :current-page="currentPage" @current-change="(pageNo: number) => emit('change', pageNo)" />
    </div>
</template>

<style lang="scss" scoped>
@use '@/pages/userHome/shared/styles/glass' as *;

.glass-pagination {
    align-self: center;
    padding: 6px;
    border-radius: 999px;
    @include glass-chip;

    :deep(.el-pagination) {
        gap: 6px;
        --el-pagination-bg-color: transparent;
        --el-pagination-button-bg-color: transparent;
    }

    :deep(.el-pager) {
        gap: 6px;
    }

    :deep(.el-pager li),
    :deep(.btn-prev),
    :deep(.btn-next) {
        min-width: 40px;
        width: 40px;
        height: 40px;
        margin: 0;
        padding: 0;
        border-radius: 50%;
        background: transparent;
        transition: color 0.2s, background-color 0.2s;
    }

    :deep(.el-pager li) {
        color: $warm-ink-2;
        font-size: 13px;
        font-weight: 600;

        &:hover {
            color: $warm-accent;
        }

        &.is-active {
            background: $warm-ink;
            color: #FFFFFF;
        }
    }

    :deep(.btn-prev),
    :deep(.btn-next) {
        color: $warm-ink;

        &:hover:not(:disabled) {
            color: $warm-accent;
        }

        &:disabled {
            background: transparent;
            color: $warm-ink-5;
        }

        span {
            min-width: 0;
            margin: 0;
            font-size: 15px;
            line-height: 1;
        }
    }
}
</style>
