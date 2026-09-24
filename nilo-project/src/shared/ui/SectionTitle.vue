<script setup lang="ts">
// 区块标题：可选的上方等宽小字（eyebrow）+ 标题，默认插槽跟在标题文字后面（如说明文字）
withDefaults(defineProps<{
    eyebrow?: string,
    title: string,
    size?: 'lg' | 'md' | 'sm',
    as?: 'h1' | 'h2' | 'h3',
}>(), {
    eyebrow: '',
    size: 'lg',
    as: 'h2',
})
</script>

<template>
    <div :class="['section-title', `section-title-${size}`]">
        <span v-if="eyebrow" class="eyebrow">{{ eyebrow }}</span>
        <div class="title-row">
            <component :is="as" class="title">{{ title }}</component>
            <span v-if="$slots.default" class="title-extra">
                <slot></slot>
            </span>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.section-title {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;

    .eyebrow {
        font-family: $warm-font-mono;
        font-size: 11px;
        letter-spacing: 0.14em;
        color: $warm-ink-4;
    }

    .title-row {
        display: flex;
        align-items: baseline;
        gap: 16px;
        min-width: 0;
    }

    .title {
        margin: 0;
        font-family: $warm-font-sans;
        font-weight: 800;
        color: $warm-ink;
        white-space: nowrap;
    }

    .title-extra {
        font-size: 13px;
        color: $warm-ink-4;
    }
}

.section-title-lg .title {
    font-size: 34px;
    letter-spacing: -0.015em;
}

.section-title-md .title {
    font-size: 28px;
    letter-spacing: -0.015em;
}

.section-title-sm .title {
    font-size: 20px;
    letter-spacing: -0.01em;
}
</style>
