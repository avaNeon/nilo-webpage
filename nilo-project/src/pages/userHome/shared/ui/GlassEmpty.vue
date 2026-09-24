<script lang="ts" setup>
defineProps<{
    title: string,
    description?: string,
}>()
</script>

<template>
    <!-- 玻璃面板里的空状态 -->
    <div class="glass-empty">
        <span class="empty-title">{{ title }}</span>
        <span v-if="description" class="empty-description">{{ description }}</span>
        <slot />
    </div>
</template>

<style lang="scss" scoped>
.glass-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 56px 0 48px;
    text-align: center;

    .empty-title {
        font-size: 16px;
        font-weight: 700;
        color: $warm-ink-2;
    }

    .empty-description {
        font-size: 13px;
        color: $warm-ink-3;
    }
}
</style>
