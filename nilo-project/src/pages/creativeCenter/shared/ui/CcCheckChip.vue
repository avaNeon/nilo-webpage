<script lang="ts" setup>
withDefaults(defineProps<{
    label: string,
    /** md：投稿表单里的互动设置（44px）；sm：稿件行里的开关（32px） */
    size?: 'md' | 'sm',
    disabled?: boolean,
}>(), {
    size: 'md',
    disabled: false,
})

const checked = defineModel<boolean>({ default: false })
</script>

<template>
    <!-- 带勾选框的胶囊：关闭弹幕 / 关闭评论 -->
    <button type="button" role="checkbox" :aria-checked="checked" :disabled="disabled"
        :class="['cc-check-chip', size, { checked }]" @click="checked = !checked">
        <span class="box" aria-hidden="true">{{ checked ? '✓' : '' }}</span>{{ label }}
    </button>
</template>

<style lang="scss" scoped>
@use '@/pages/creativeCenter/shared/styles/cc' as *;

.cc-check-chip {
    @include reset-button;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    height: 44px;
    padding: 0 18px 0 12px;
    border-radius: 999px;
    background: $warm-sunken;
    color: $warm-ink;
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    transition: background-color 0.2s, color 0.2s;

    .box {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        border-radius: 7px;
        background: #FFFFFF;
        box-shadow: inset 0 0 0 1.5px rgba(11, 12, 18, 0.25);
        color: #FFFFFF;
        font-size: 12px;
        font-weight: 700;
        line-height: 1;
        transition: background-color 0.2s, box-shadow 0.2s;
    }

    &.checked {
        background: $warm-accent-soft;
        color: $warm-accent;

        .box {
            background: $warm-accent;
            box-shadow: none;
        }
    }

    &:disabled {
        opacity: 0.5;
    }

    &.sm {
        gap: 8px;
        height: 32px;
        padding: 0 14px 0 8px;
        font-size: 12px;

        .box {
            width: 18px;
            height: 18px;
            border-radius: 6px;
            font-size: 11px;
        }
    }
}
</style>
