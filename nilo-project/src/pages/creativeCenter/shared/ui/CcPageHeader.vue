<script lang="ts" setup>
defineProps<{
    title: string,
    /** 标题旁边的数量，如 (28)；不传就不显示 */
    count?: number | string | null,
}>()
</script>

<template>
    <!-- 蓝底上的页面标题行：左边标题 + 数量，右边放搜索框 / 视频筛选 / 日期范围 -->
    <div class="cc-page-header">
        <div class="title-group">
            <h1 class="page-title">{{ title }}</h1>
            <span v-if="count !== undefined && count !== null && count !== ''" class="page-count">({{ count }})</span>
        </div>
        <div v-if="$slots.default" class="page-actions">
            <slot />
        </div>
    </div>
</template>

<style lang="scss" scoped>
.cc-page-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
    min-height: 52px;
}

.title-group {
    display: flex;
    align-items: baseline;
    gap: 12px;
    min-width: 0;
}

.page-title {
    margin: 0;
    font-size: 36px;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.1;
    color: #FFFFFF;
    white-space: nowrap;
}

.page-count {
    font-size: 15px;
    color: $warm-accent-on-dark-2;
}

.page-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
}
</style>
