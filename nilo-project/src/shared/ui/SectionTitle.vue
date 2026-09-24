<script setup lang="ts">
// 区块标题：上方等宽小字（eyebrow）+ 下方标题，默认插槽跟在标题文字后面（如评论数）
withDefaults(defineProps<{
    eyebrow: string,
    title: string,
    size?: 'lg' | 'md' | 'sm',
    as?: 'h1' | 'h2' | 'h3',
}>(), {
    size: 'lg',
    as: 'h2',
})
</script>

<template>
    <div :class="['section-title', `section-title-${size}`]">
        <span class="eyebrow">{{ eyebrow }}</span>
        <component :is="as" class="title">{{ title }}<span v-if="$slots.default"
                class="title-extra"><slot></slot></span></component>
    </div>
</template>

<style lang="scss" scoped>
.section-title {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;

    .eyebrow {
        font-family: $warm-font-mono;
        font-size: 11px;
        letter-spacing: 0.14em;
        color: $warm-ink-4;
    }

    .title {
        margin: 0;
        font-family: $warm-font-sans;
        font-weight: 700;
        color: $warm-ink;
    }

    .title-extra {
        margin-left: 0.3em;
    }
}

.section-title-lg {
    gap: 8px;

    .title {
        font-size: 28px;
        letter-spacing: -0.01em;
    }
}

.section-title-md .title {
    font-size: 22px;
}

.section-title-sm .title {
    font-size: 18px;
}
</style>
