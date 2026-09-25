<script lang="ts" setup generic="T extends string | number">
defineProps<{
    options: { label: string, value: T, count?: number | string | null }[],
    /** md：稿件状态标签（40px）；sm：投稿类型 自制 / 转载（38px） */
    size?: 'md' | 'sm',
    disabled?: boolean,
}>()

const model = defineModel<T>({ required: true })
</script>

<template>
    <!-- 浅灰底分段选择：选中项白底蓝字带一点投影 -->
    <div :class="['cc-segmented', size ?? 'md', { disabled }]" role="tablist">
        <button v-for="option in options" :key="option.value" type="button" role="tab"
            :aria-selected="option.value === model" :disabled="disabled"
            :class="['segment', { active: option.value === model }]" @click="model = option.value">
            {{ option.label }}
            <span v-if="option.count !== undefined && option.count !== null" class="segment-count">{{ option.count
                }}</span>
        </button>
    </div>
</template>

<style lang="scss" scoped>
@use '@/pages/creativeCenter/shared/styles/cc' as *;

.cc-segmented {
    display: inline-flex;
    gap: 2px;
    padding: 4px;
    border-radius: 999px;
    background: $warm-sunken;
}

.segment {
    @include reset-button;
    display: flex;
    align-items: center;
    gap: 8px;
    height: 40px;
    padding: 0 18px;
    border-radius: 999px;
    color: $warm-ink-2;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;

    .segment-count {
        font-size: 12px;
        font-weight: 500;
        color: $warm-ink-4;
    }

    &:hover:not(.active):not(:disabled) {
        color: $warm-ink;
    }

    &.active {
        background: #FFFFFF;
        color: $warm-accent;
        font-weight: 700;
        box-shadow: 0 6px 16px -8px rgba(11, 12, 18, 0.3);

        .segment-count {
            color: $warm-accent;
        }
    }
}

.sm .segment {
    height: 38px;
    padding: 0 22px;
}

.disabled {
    opacity: 0.6;
}
</style>
