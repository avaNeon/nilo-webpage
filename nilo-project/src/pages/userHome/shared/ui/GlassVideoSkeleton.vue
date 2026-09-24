<script lang="ts" setup>
withDefaults(defineProps<{
    count?: number,
}>(), {
    count: 5,
})
</script>

<template>
    <!-- 和 GlassVideoCard 一样的封面 + 两行，放进同一个网格里 -->
    <div v-for="n in count" :key="n" class="glass-video-skeleton" aria-hidden="true">
        <span class="skeleton-block skeleton-cover"></span>
        <span class="skeleton-block skeleton-title"></span>
        <span class="skeleton-block skeleton-sub"></span>
    </div>
</template>

<style lang="scss" scoped>
.glass-video-skeleton {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 8px 8px 14px;
}

.skeleton-block {
    display: block;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.5);
}

.skeleton-cover {
    aspect-ratio: 16 / 9;
    border-radius: 18px;
}

.skeleton-title {
    width: 88%;
    height: 15px;
    margin: 0 4px;
}

.skeleton-sub {
    width: 52%;
    height: 12px;
    margin: 0 4px;
}

@media (prefers-reduced-motion: no-preference) {
    .skeleton-block {
        animation: skeleton-pulse 1.4s ease-in-out infinite;
    }
}

@keyframes skeleton-pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.55;
    }
}
</style>
