<script lang="ts" setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useWindowSize } from '@/shared/composables/useWindowSize'

const props = withDefaults(defineProps<{
    introduction: string,
    tags: string[],
}>(), {
    introduction: '',
    tags: () => []
})

const { width: windowWidth } = useWindowSize()

const COLLAPSED_HEIGHT = 200

const textRef = ref<HTMLElement | null>(null)
const isExpanded = ref(false)
const isOverflowing = ref(false)
const dynamicMaxHeight = ref(COLLAPSED_HEIGHT + 'px')
const isTransitioning = ref(false)

// ── 文本格式化：转义 → 换行 → 链接 ──
const URL_RE = /(https?:\/\/[^\s<>"]+)/g

function escapeHtml(s: string)
{
    const amp = '&' + 'amp;'
    const lt = '&' + 'lt;'
    const gt = '&' + 'gt;'
    const quot = '&' + 'quot;'
    return s.replace(/&/g, amp).replace(/</g, lt).replace(/>/g, gt).replace(/"/g, quot)
}

const formattedIntroduction = computed(() =>
{
    let html = escapeHtml(props.introduction)
    html = html.replace(/\\n/g, '<br>')
    html = html.replace(URL_RE, '<a class="inline-link" href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
    return html
})

// 简介和标签都没有时整块不显示
const hasContent = computed(() => !!props.introduction || props.tags.length > 0)

// ── 高度测量（同步，无闪烁） ──
function measureFullHeight(el: HTMLElement)
{
    const prev = el.style.maxHeight
    el.style.maxHeight = 'none'
    const h = el.scrollHeight
    el.style.maxHeight = prev
    return h
}

async function checkOverflow()
{
    await nextTick()
    const el = textRef.value
    if (!el)
    {
        isOverflowing.value = false
        return
    }
    isOverflowing.value = measureFullHeight(el) > COLLAPSED_HEIGHT
}

// ── 展开 / 收起 ──
function expand()
{
    if (isTransitioning.value) return
    isTransitioning.value = true
    const el = textRef.value!
    dynamicMaxHeight.value = measureFullHeight(el) + 'px'
    isExpanded.value = true
    setTimeout(() =>
    {
        dynamicMaxHeight.value = 'none'
        isTransitioning.value = false
    }, 400)
}

function collapse()
{
    if (isTransitioning.value) return
    isTransitioning.value = true
    const el = textRef.value!
    dynamicMaxHeight.value = el.scrollHeight + 'px'
    void el.offsetHeight // 强制重排，锁定过渡起点
    dynamicMaxHeight.value = COLLAPSED_HEIGHT + 'px'
    isExpanded.value = false
    setTimeout(() => (isTransitioning.value = false), 400)
}

// ── 生命周期 ──
onMounted(checkOverflow)

watch(() => props.introduction, () =>
{
    isExpanded.value = false
    dynamicMaxHeight.value = COLLAPSED_HEIGHT + 'px'
    checkOverflow()
})

watch(windowWidth, () =>
{
    if (!isExpanded.value) checkOverflow()
})
</script>

<template>
    <div v-if="hasContent" class="introduction-bar">
        <div v-if="props.introduction" class="introduction-text-wrapper">
            <p ref="textRef" class="introduction-text" :style="{ maxHeight: dynamicMaxHeight }"
                v-html="formattedIntroduction" />
            <div class="fade-overlay" :class="{ 'is-visible': isOverflowing && !isExpanded }" @click="expand"></div>
        </div>
        <button v-if="isOverflowing && !isExpanded" type="button" class="toggle-button" @click="expand">
            展开全部
        </button>
        <button v-else-if="isExpanded" type="button" class="toggle-button" @click="collapse">
            收起
        </button>
        <div v-if="props.tags.length" class="tag-items">
            <!-- 点标签去搜索页 -->
            <RouterLink v-for="tag in props.tags" :key="tag" class="tag-item"
                :to="{ name: 'video-search', params: { keyword: tag } }" target="_blank">
                #{{ tag }}
            </RouterLink>
        </div>
    </div>
</template>

<style lang="scss" scoped>
// 浅灰底圆角卡片
.introduction-bar {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
    padding: 24px 26px;
    border-radius: 22px;
    background: $warm-sunken;

    .introduction-text-wrapper {
        position: relative;
        width: 100%;
        max-width: 780px;
    }

    .introduction-text {
        display: block;
        margin: 0;
        overflow: hidden;
        font-size: 15px;
        line-height: 1.9;
        color: $warm-ink-2;
        white-space: pre-line;
        overflow-wrap: anywhere;
        text-wrap: pretty;
        transition: max-height 0.4s ease;

        :deep(a.inline-link) {
            color: $warm-accent-text;
            text-decoration: none;

            &:hover {
                text-decoration: underline;
                text-underline-offset: 3px;
            }
        }
    }

    // 折叠时底部渐隐到卡片底色
    .fade-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 80px;
        background: linear-gradient(to bottom, rgba(243, 244, 247, 0), $warm-sunken);
        cursor: pointer;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;

        &.is-visible {
            opacity: 1;
            pointer-events: auto;
        }
    }

    .toggle-button {
        margin-top: -6px;
        padding: 0;
        border: none;
        background: none;
        font-size: 13px;
        font-weight: 500;
        color: $warm-ink-3;
        cursor: pointer;
        user-select: none;
        transition: color 0.2s;

        &:hover {
            color: $warm-accent;
        }

        &:focus-visible {
            outline: 2px solid $warm-accent;
            outline-offset: 2px;
            border-radius: 4px;
        }
    }

    .tag-items {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 16px;

        .tag-item {
            font-size: 13px;
            font-weight: 600;
            color: $warm-accent;

            &:hover {
                text-decoration: underline;
                text-underline-offset: 3px;
            }
        }
    }
}
</style>
