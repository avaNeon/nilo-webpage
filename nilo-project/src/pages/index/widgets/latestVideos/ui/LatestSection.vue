<script setup lang="ts">
import SectionTitle from '@/shared/ui/SectionTitle.vue';
import VideoCard from '@/shared/entities/videoCard/ui/VideoCard.vue';
import VideoCardSkeleton from '@/pages/index/entities/videoCardSkeleton/ui/VideoCardSkeleton.vue';
import useCategoryStore from '@/shared/store/CategoryStore';
import { setPageTitle } from '@/shared/utils/PageTitle';
import { useLatestVideos } from '@/pages/index/composables/useLatestVideos';
import { computed, nextTick, useTemplateRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CategoryChips from './CategoryChips.vue';

/** 首次加载的占位卡片数（两行） */
const SKELETON_COUNT = 8

const props = withDefaults(defineProps<{
    /** 上方区块已加载完成、高度稳定，可以滚动定位到本区块 */
    scrollReady?: boolean,
}>(), {
    scrollReady: true,
})

const route = useRoute()
const router = useRouter()
const categoryStore = useCategoryStore()
const sectionRef = useTemplateRef<HTMLElement>('sectionRef')

const {
    videoList,
    visibleVideoList,
    hasMore,
    isSwitching,
    isLoadingMore,
    isLoaded,
    loadFailed,
    loadMore,
    reload,
} = useLatestVideos()

// 首次进入或从空分类切换时还没有可展示的视频，显示占位卡片
const showSkeleton = computed(() => videoList.value.length === 0 && (isSwitching.value || !isLoaded.value))

const currentPCategory = computed(() => categoryStore.currentPCategory)
const subCategories = computed(() => currentPCategory.value?.children ?? [])

/** 子分类路由，不传子分类时为一级分类「全部」 */
function subCategoryPath(subCategoryNumber?: string): string
{
    const parentPath = `/c/${currentPCategory.value?.categoryNumber ?? ''}`
    return subCategoryNumber ? `${parentPath}/${subCategoryNumber}` : parentPath
}

/*——————分类导航：路由是唯一状态来源—————— */

// 本区块内点击触发的导航目标，这类导航不需要滚动定位
let internalTargetPath: string | null = null
// 等分类数据和上方内容就绪后再滚动
let pendingScroll = false

function navigate(path: string)
{
    if (route.path === path)
    {
        return
    }
    internalTargetPath = path
    router.push(path).then((failure) =>
    {
        if (failure && internalTargetPath === path)
        {
            internalTargetPath = null
        }
    })
}

function scrollIntoViewIfPending()
{
    if (!pendingScroll || !categoryStore.isInited || !props.scrollReady)
    {
        return
    }
    pendingScroll = false
    nextTick(() =>
    {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        sectionRef.value?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    })
}

// 直接打开 /c/... 或从顶栏分类菜单进入时，滚动到本区块；区块内切换分类不滚动
watch(() => route.path, (path) =>
{
    const isInternal = internalTargetPath === path
    internalTargetPath = null
    pendingScroll = !isInternal && route.name === 'category'
    scrollIntoViewIfPending()
}, { immediate: true })

watch([() => categoryStore.isInited, () => props.scrollReady], scrollIntoViewIfPending)

// 分类页标题：有子分类用子分类名，否则用一级分类名；首页沿用路由默认标题
watch(
    [
        () => route.fullPath,
        () => categoryStore.currentPCategory,
        () => categoryStore.currentCategoryNumber,
    ],
    () =>
    {
        if (route.name !== 'category')
        {
            return
        }
        const parent = categoryStore.currentPCategory
        if (!parent?.categoryName)
        {
            setPageTitle('分类')
            return
        }
        const sub = parent.children?.find(item => item.categoryNumber === categoryStore.currentCategoryNumber)
        setPageTitle(sub?.categoryName ?? parent.categoryName)
    },
    { immediate: true },
)
</script>

<template>
    <section ref="sectionRef" class="latest-section" aria-label="最新视频">
        <div class="section-head">
            <div class="head-main">
                <SectionTitle eyebrow="LATEST" title="最新视频" size="lg" />
                <!-- 当前一级分类有子分类时展示 -->
                <div v-if="subCategories.length" class="sub-categories" role="group" aria-label="子分类">
                    <button type="button" :class="['sub-pill', { active: !categoryStore.currentCategoryNumber }]"
                        :aria-pressed="!categoryStore.currentCategoryNumber"
                        @click="navigate(subCategoryPath())">全部</button>
                    <button v-for="sub in subCategories" :key="sub.categoryNumber" type="button"
                        :class="['sub-pill', { active: categoryStore.currentCategoryNumber === sub.categoryNumber }]"
                        :aria-pressed="categoryStore.currentCategoryNumber === sub.categoryNumber"
                        @click="navigate(subCategoryPath(sub.categoryNumber))">
                        {{ sub.categoryName }}
                    </button>
                </div>
            </div>
            <CategoryChips @navigate="navigate" />
        </div>

        <div v-if="showSkeleton" class="video-grid" aria-busy="true">
            <VideoCardSkeleton v-for="index in SKELETON_COUNT" :key="index" />
        </div>
        <!-- 切换分类期间保留上一个分类的视频并变淡，避免闪成空白 -->
        <div v-else-if="visibleVideoList.length" :class="['video-grid', { 'is-switching': isSwitching }]"
            :aria-busy="isSwitching">
            <VideoCard v-for="(videoInfo, index) in visibleVideoList" :key="videoInfo.videoId ?? index"
                :video-info="videoInfo" layout="grid" />
        </div>
        <div v-else-if="isLoaded" class="empty-state">
            <template v-if="loadFailed">
                <span>视频加载失败了</span>
                <button type="button" class="retry-button" @click="reload">重新加载</button>
            </template>
            <span v-else>这个分类下还没有视频</span>
        </div>

        <div v-if="visibleVideoList.length && !showSkeleton" class="section-foot">
            <button v-if="hasMore" type="button" class="load-more" :disabled="isLoadingMore || isSwitching"
                :aria-busy="isLoadingMore" @click="loadMore">
                <template v-if="isLoadingMore"><span class="spinner" aria-hidden="true"></span>加载中…</template>
                <template v-else>显示更多</template>
            </button>
            <span v-else class="end-text">— 已经到底了 —</span>
        </div>
    </section>
</template>

<style lang="scss" scoped>
@keyframes latest-spin {
    to {
        transform: rotate(360deg);
    }
}

.latest-section {
    margin-top: 80px;
    scroll-margin-top: calc(#{$warm-header-height} + 20px);

    button {
        padding: 0;
        border: none;
        background: transparent;
        font: inherit;
        color: inherit;
        cursor: pointer;
    }
}

.section-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
}

.head-main {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

/*——————子分类—————— */

.sub-categories {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 16px;
}

.latest-section .sub-pill {
    display: inline-flex;
    align-items: center;
    height: 30px;
    padding: 0 12px;
    border: 1px solid $warm-border-strong;
    border-radius: 8px;
    font-size: 13px;
    color: $warm-ink-3;
    white-space: nowrap;
    transition: background 0.2s, border-color 0.2s, color 0.2s;

    &:hover {
        border-color: $warm-ink;
        color: $warm-ink;
    }

    &.active {
        border-color: $warm-ink;
        background: $warm-ink;
        color: #FFFFFF;
        font-weight: 500;
    }

    &:focus-visible {
        outline: 2px solid $warm-ink;
        outline-offset: 2px;
    }
}

/*——————视频网格—————— */

.video-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 40px 24px;
    margin-top: 28px;
    transition: opacity 0.2s ease;

    &.is-switching {
        opacity: 0.5;
        pointer-events: none;
    }
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    height: 200px;
    margin-top: 28px;
    border: 1px dashed $warm-border-strong;
    border-radius: 16px;
    font-size: 14px;
    color: $warm-ink-4;
}

.latest-section .retry-button {
    height: 32px;
    padding: 0 14px;
    border: 1px solid $warm-border-strong;
    border-radius: 9px;
    background: $warm-card;
    font-size: 13px;
    font-weight: 500;
    color: $warm-ink;
    transition: border-color 0.2s;

    &:hover {
        border-color: $warm-ink;
    }
}

/*——————底部：显示更多 / 到底—————— */

.section-foot {
    display: flex;
    justify-content: center;
    margin-top: 40px;
}

.latest-section .load-more {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 44px;
    padding: 0 28px;
    border: 1px solid $warm-border-strong;
    border-radius: 12px;
    background: $warm-card;
    font-size: 14px;
    font-weight: 500;
    color: $warm-ink;
    transition: border-color 0.2s, color 0.2s;

    &:hover:not(:disabled) {
        border-color: $warm-ink;
    }

    &:disabled {
        color: $warm-ink-3;
        cursor: default;
    }

    &[aria-busy='true'] {
        cursor: progress;
    }

    &:focus-visible {
        outline: 2px solid $warm-ink;
        outline-offset: 2px;
    }
}

.spinner {
    width: 14px;
    height: 14px;
    border: 1.5px solid rgba(26, 25, 22, 0.15);
    border-top-color: $warm-ink;
    border-radius: 50%;
    animation: latest-spin 0.8s linear infinite;
}

.end-text {
    font-family: $warm-font-mono;
    font-size: 12px;
    letter-spacing: 0.14em;
    color: $warm-ink-4;
}

@media (prefers-reduced-motion: reduce) {
    .video-grid {
        transition: none;
    }

    .spinner {
        animation-duration: 1.6s;
    }
}
</style>
