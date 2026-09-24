<template>
    <!-- 视频卡片（grid 布局）加载占位，几何尺寸与 VideoCard 保持一致 -->
    <div class="video-card-skeleton" aria-hidden="true">
        <span class="skeleton-cover"></span>
        <span class="skeleton-info">
            <span class="skeleton-avatar"></span>
            <span class="skeleton-lines">
                <span class="skeleton-line title"></span>
                <span class="skeleton-line title short"></span>
                <span class="skeleton-line meta"></span>
            </span>
        </span>
    </div>
</template>

<style lang="scss" scoped>
@keyframes skeleton-pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.55;
    }
}

.video-card-skeleton {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;

    .skeleton-cover,
    .skeleton-avatar,
    .skeleton-line {
        display: block;
        background: $warm-sunken;
        animation: skeleton-pulse 1.6s ease-in-out infinite;
    }

    .skeleton-cover {
        aspect-ratio: 16 / 9;
        border-radius: 14px;
    }

    .skeleton-info {
        display: flex;
        gap: 12px;
    }

    .skeleton-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        flex-shrink: 0;
    }

    .skeleton-lines {
        display: flex;
        flex-direction: column;
        gap: 9px;
        flex: 1;
        min-width: 0;
        padding-top: 4px;
    }

    .skeleton-line {
        height: 14px;
        border-radius: 6px;

        &.title {
            width: 92%;
        }

        &.short {
            width: 58%;
        }

        &.meta {
            width: 40%;
            height: 12px;
            margin-top: 4px;
        }
    }
}

@media (prefers-reduced-motion: reduce) {

    .video-card-skeleton .skeleton-cover,
    .video-card-skeleton .skeleton-avatar,
    .video-card-skeleton .skeleton-line {
        animation: none;
    }
}
</style>
