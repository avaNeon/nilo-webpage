<script lang="ts" setup>
withDefaults(defineProps<{
    title?: string,
    /** 标题右边的数量，null / 空串不显示 */
    count?: string | number | null,
    /** 数量用等宽字体，如「(3/50)」 */
    monoCount?: boolean,
    /** 标题和内容的间距 */
    gap?: number,
}>(), {
    title: '',
    count: null,
    monoCount: false,
    gap: 24,
})
</script>

<template>
    <!-- 个人主页的玻璃内容面板：大标题 + 数量，右侧放操作 -->
    <section class="glass-section" :style="{ gap: gap + 'px' }">
        <div class="section-head">
            <div class="head-title">
                <slot name="title">
                    <h2>{{ title }}</h2>
                </slot>
                <span v-if="count !== null && count !== ''" :class="['head-count', { mono: monoCount }]">
                    {{ count }}
                </span>
            </div>
            <div v-if="$slots.actions" class="head-actions">
                <slot name="actions" />
            </div>
        </div>
        <slot />
    </section>
</template>

<style lang="scss" scoped>
@use '@/pages/userHome/shared/styles/glass' as *;

.glass-section {
    display: flex;
    flex-direction: column;
    min-width: 0;
    padding: 28px;
    border-radius: 36px;
    @include glass-panel;
}

.section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    min-height: 38px;
    padding: 0 4px;
}

.head-title {
    display: flex;
    align-items: baseline;
    gap: 12px;
    min-width: 0;

    h2 {
        margin: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 28px;
        font-weight: 800;
        letter-spacing: -0.015em;
    }
}

.head-count {
    flex-shrink: 0;
    font-size: 14px;
    color: $warm-ink-3;

    &.mono {
        font-family: $warm-font-mono;
    }
}

.head-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}
</style>
