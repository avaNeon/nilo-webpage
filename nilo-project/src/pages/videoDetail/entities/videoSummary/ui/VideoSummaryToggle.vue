<script lang="ts" setup>
defineProps<{
    /** AI 总结是否已展开 */
    open: boolean,
}>()

const emit = defineEmits<{ toggle: [] }>()
</script>

<template>
    <button type="button" :class="['summary-toggle', { open }]" :aria-expanded="open" @click="emit('toggle')">
        <span class="mark" aria-hidden="true"></span>
        <span class="label">AI 总结</span>
        <span class="chevron" aria-hidden="true"></span>
    </button>
</template>

<style lang="scss" scoped>
// 和操作栏里的点赞、投币等胶囊同一个样式；展开后换浅蓝底 + 蓝字
.summary-toggle {
    flex-shrink: 0;
    height: 40px;
    padding: 0 14px 0 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    border: none;
    border-radius: 999px;
    background: $warm-sunken;
    color: $warm-ink;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;

    &:hover {
        background: #E9EBF0;
    }

    &:focus-visible {
        outline: 2px solid $warm-accent;
        outline-offset: 2px;
    }

    // 蓝色圆点标记：大圆里偏右上一个白点
    .mark {
        position: relative;
        flex-shrink: 0;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: $warm-accent;

        &::after {
            content: '';
            position: absolute;
            left: 9px;
            top: 4px;
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: #FFFFFF;
        }
    }

    // 箭头方向与侧栏 AI 助手卡片一致：收起朝上，展开朝下
    .chevron {
        flex-shrink: 0;
        width: 6px;
        height: 6px;
        margin-left: 2px;
        border-right: 1.5px solid currentColor;
        border-bottom: 1.5px solid currentColor;
        transform: translateY(2px) rotate(-135deg);
        transition: transform 0.2s;
    }

    &.open {
        background: $warm-accent-soft;
        color: $warm-accent-text;

        .chevron {
            transform: translateY(-2px) rotate(45deg);
        }
    }
}
</style>
