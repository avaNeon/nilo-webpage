<script lang="ts" setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useWindowSize } from '@/shared/composables/useWindowSize'

const props = withDefaults(defineProps<{
    introduction: string,
    tags: string[]
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

function escapeHtml(s: string) {
    const amp = '&' + 'amp;'
    const lt = '&' + 'lt;'
    const gt = '&' + 'gt;'
    const quot = '&' + 'quot;'
    return s.replace(/&/g, amp).replace(/</g, lt).replace(/>/g, gt).replace(/"/g, quot)
}

const formattedIntroduction = computed(() => {
    let html = escapeHtml(props.introduction)
    html = html.replace(/\\n/g, '<br>')
    html = html.replace(URL_RE, '<a class="inline-link" href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
    return html
})

// ── 高度测量（同步，无闪烁） ──
function measureFullHeight(el: HTMLElement) {
    const prev = el.style.maxHeight
    el.style.maxHeight = 'none'
    const h = el.scrollHeight
    el.style.maxHeight = prev
    return h
}

async function checkOverflow() {
    await nextTick()
    const el = textRef.value
    if (!el) return
    isOverflowing.value = measureFullHeight(el) > COLLAPSED_HEIGHT
}

// ── 展开 / 收起 ──
function expand() {
    if (isTransitioning.value) return
    isTransitioning.value = true
    const el = textRef.value!
    dynamicMaxHeight.value = measureFullHeight(el) + 'px'
    isExpanded.value = true
    setTimeout(() => {
        dynamicMaxHeight.value = 'none'
        isTransitioning.value = false
    }, 400)
}

function collapse() {
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

watch(() => props.introduction, () => {
    isExpanded.value = false
    dynamicMaxHeight.value = COLLAPSED_HEIGHT + 'px'
    checkOverflow()
})

watch(windowWidth, () => {
    if (!isExpanded.value) checkOverflow()
})
</script>

<template>
    <div class="introduction-bar">
        <div class="introduction-text-wrapper">
            <p ref="textRef" class="introduction-text" :style="{ maxHeight: dynamicMaxHeight }"
                v-html="formattedIntroduction" />
            <div class="fade-overlay" :class="{ 'is-visible': isOverflowing && !isExpanded }" @click="expand">
                <span class="expand-hint">{{ isOverflowing && !isExpanded ? '展开' : '' }}</span>
            </div>
        </div>
        <div v-if="isExpanded" class="collapse-hint" @click="collapse">
            收起
        </div>
        <div class="category-items">
            <!-- jump to search panel -->
            <div v-for="tag in props.tags" :key="tag" class="category-item">
                {{ tag }}
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.introduction-bar {

    .introduction-text-wrapper {
        position: relative;

    }

    .introduction-text {
        display: block;
        margin: 10px 5px;
        overflow: hidden;
        font-size: 18px;
        line-height: 20px;
        color: $color-text-primary;
        transition: max-height 0.4s ease;

        :deep(a) {
            color: $color-link;
            text-decoration: none;

            &:hover {
                color: $color-link-strong;
            }
        }
    }

    .fade-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 80px;
        background: linear-gradient(to bottom, transparent, white);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;

        &.is-visible {
            opacity: 1;
            pointer-events: auto;
        }

        .expand-hint {
            font-size: 14px;
            font-weight: 500;
            color: $color-bilibili-blue;
            user-select: none;
        }
    }

    .collapse-hint {
        text-align: center;
        font-size: 14px;
        font-weight: 500;
        color: $color-bilibili-blue;
        cursor: pointer;
        user-select: none;
        padding: 4px 0 8px;
    }

    .category-items {
        display: flex;
        column-gap: 10px;

        .category-item {
            padding: 10px;
            background-color: $color-neutral-1;
            border-radius: 15px;
            font-size: 14px;
            line-height: 14px;
            font-weight: 500;
            color: $color-text-secondary;
            transition: all 0.3s ease;

            &:hover {
                cursor: pointer;
                font-size: 16px;
                background-color: $color-neutral-2;
            }
        }
    }
}
</style>

<style lang="scss">
.inline-link {
    display: inline-block;
    color: $color-bilibili-blue;
    transition: all 0.3s ease;

    &:hover {
        font-weight: bold;
        font-size: 19px;
    }
}
</style>