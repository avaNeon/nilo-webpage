<script setup lang="ts">
defineProps<{
    title: string,
    description?: string,
}>()
</script>

<template>
    <!-- 空状态：浅蓝圆 + 偏右上的蓝点，下面标题、说明和操作按钮 -->
    <div class="empty-state">
        <span class="empty-mark" aria-hidden="true"></span>
        <span class="empty-title">{{ title }}</span>
        <span v-if="description" class="empty-description">{{ description }}</span>
        <div v-if="$slots.default" class="empty-actions">
            <slot></slot>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 18px;
    padding: 120px 0;
    text-align: center;
    color: $warm-ink;
}

.empty-mark {
    position: relative;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: $warm-accent-soft;

    &::after {
        content: '';
        position: absolute;
        left: 30px;
        top: 12px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: $warm-accent;
    }
}

.empty-title {
    font-size: 20px;
    font-weight: 700;
}

.empty-description {
    font-size: 14px;
    color: $warm-ink-4;
}

.empty-actions {
    display: flex;
    gap: 10px;
    margin-top: 8px;

    // 主按钮：蓝色胶囊，悬停变墨色；次按钮：浅灰胶囊
    :deep(.empty-primary),
    :deep(.empty-secondary) {
        display: flex;
        align-items: center;
        height: 46px;
        border: none;
        border-radius: 999px;
        font: inherit;
        font-size: 14px;
        text-decoration: none;
        cursor: pointer;
        transition: background-color 0.2s, color 0.2s;

        &:focus-visible {
            outline: 2px solid $warm-accent;
            outline-offset: 2px;
        }
    }

    :deep(.empty-primary) {
        padding: 0 24px;
        background: $warm-accent;
        color: #FFFFFF;
        font-weight: 600;

        &:hover {
            background: $warm-ink;
            color: #FFFFFF;
        }
    }

    :deep(.empty-secondary) {
        padding: 0 22px;
        background: $warm-sunken;
        color: $warm-ink;
        font-weight: 500;

        &:hover {
            background: #E9EBF0;
        }
    }
}
</style>
