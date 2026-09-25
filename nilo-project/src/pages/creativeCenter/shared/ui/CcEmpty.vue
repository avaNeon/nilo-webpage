<script lang="ts" setup>
defineProps<{
    title: string,
    sub?: string,
}>()
</script>

<template>
    <!-- 列表面板里的空状态 -->
    <div class="cc-empty">
        <span class="empty-title">{{ title }}</span>
        <span v-if="sub" class="empty-sub">{{ sub }}</span>
        <slot />
    </div>
</template>

<style lang="scss" scoped>
@use '@/pages/creativeCenter/shared/styles/cc' as *;

.cc-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 72px 0;
    border-top: 1px solid $cc-line;
    text-align: center;
}

.empty-title {
    font-size: 16px;
    font-weight: 700;
    color: $warm-ink;
}

.empty-sub {
    font-size: 13px;
    color: $warm-ink-4;
}
</style>
