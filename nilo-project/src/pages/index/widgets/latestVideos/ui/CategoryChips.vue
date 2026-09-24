<script setup lang="ts">
import type { CategoryInfo } from '@/shared/model/CategoryInfo';
import useCategoryStore from '@/shared/store/CategoryStore';
import { computed, nextTick, onBeforeUnmount, ref, useId, useTemplateRef, watch } from 'vue';

/** 固定展示的一级分类数，其余收进最后一个「更多」槽位 */
const FIXED_CATEGORY_COUNT = 6
/** 下拉菜单每行的选项数，方向键上下移动时按行跳 */
const MENU_COLUMN_COUNT = 3
/** 指针离开槽位和菜单后延迟关闭（ms），留出从槽位移到菜单的时间 */
const MENU_CLOSE_DELAY = 150

const emit = defineEmits<{
    /** 选择分类，参数为目标路由 */
    navigate: [path: string],
}>()

const categoryStore = useCategoryStore()
const menuId = useId()

const slotRef = useTemplateRef<HTMLButtonElement>('slotRef')
const menuRef = useTemplateRef<HTMLDivElement>('menuRef')

const currentPCategoryNumber = computed(() => categoryStore.currentPCategory?.categoryNumber ?? null)
const fixedCategories = computed(() => categoryStore.categoryList.slice(0, FIXED_CATEGORY_COUNT))
const fixedNumberSet = computed(() => new Set(fixedCategories.value.map(category => category.categoryNumber)))

// 最近一次选中的非固定分类，回到「全部」或固定分类后仍留在槽位上
const lastPickedNumber = ref<string | null>(null)

watch(currentPCategoryNumber, (categoryNumber) =>
{
    if (categoryNumber && !fixedNumberSet.value.has(categoryNumber))
    {
        lastPickedNumber.value = categoryNumber
    }
}, { immediate: true })

// 槽位：当前选中的非固定分类 > 上次选过的 > 第 7 个分类
const moreCategory = computed((): CategoryInfo | null =>
{
    const current = categoryStore.currentPCategory
    if (current && !fixedNumberSet.value.has(current.categoryNumber))
    {
        return current
    }
    const categoryList = categoryStore.categoryList
    const picked = lastPickedNumber.value
        ? categoryList.find(category => category.categoryNumber === lastPickedNumber.value)
        : undefined
    return picked ?? categoryList[FIXED_CATEGORY_COUNT] ?? null
})

const menuOptions = computed(() => categoryStore.categoryList.filter(category =>
    !fixedNumberSet.value.has(category.categoryNumber)
    && category.categoryNumber !== moreCategory.value?.categoryNumber))

const hasMenu = computed(() => menuOptions.value.length > 0)

function selectCategory(category: CategoryInfo | null)
{
    emit('navigate', category ? `/c/${category.categoryNumber}` : '/')
}

/*——————「更多」下拉菜单：悬停或聚焦打开，离开后延迟关闭—————— */

const menuOpen = ref(false)
// 指针是否在槽位或菜单上；在上面时失焦不关闭，交给 mouseleave 处理
let pointerInside = false
// 程序性地把焦点还给槽位时不重新打开菜单
let suppressFocusOpen = false
let closeTimer: number | undefined

function clearCloseTimer()
{
    if (closeTimer !== undefined)
    {
        window.clearTimeout(closeTimer)
        closeTimer = undefined
    }
}

function openMenu()
{
    clearCloseTimer()
    if (hasMenu.value)
    {
        menuOpen.value = true
    }
}

function closeMenu()
{
    clearCloseTimer()
    menuOpen.value = false
    // 菜单被移除时不会触发 mouseleave，这里一并复位
    pointerInside = false
}

function onPointerEnter()
{
    pointerInside = true
    openMenu()
}

function onPointerLeave()
{
    pointerInside = false
    clearCloseTimer()
    closeTimer = window.setTimeout(closeMenu, MENU_CLOSE_DELAY)
}

function onSlotFocus()
{
    if (!suppressFocusOpen)
    {
        openMenu()
    }
}

function onFocusOut(event: FocusEvent)
{
    const next = event.relatedTarget as Node | null
    if (next && (slotRef.value?.contains(next) || menuRef.value?.contains(next)))
    {
        return
    }
    if (!pointerInside)
    {
        closeMenu()
    }
}

function focusSlot()
{
    suppressFocusOpen = true
    slotRef.value?.focus()
    suppressFocusOpen = false
}

function getOptionButtons(): HTMLButtonElement[]
{
    return Array.from(menuRef.value?.querySelectorAll<HTMLButtonElement>('.menu-option') ?? [])
}

async function onSlotKeydown(event: KeyboardEvent)
{
    if (event.key === 'Escape' && menuOpen.value)
    {
        event.preventDefault()
        closeMenu()
    }
    else if (event.key === 'ArrowDown' && hasMenu.value)
    {
        event.preventDefault()
        openMenu()
        await nextTick()
        getOptionButtons()[0]?.focus()
    }
}

// 菜单内方向键按网格移动焦点，Esc 关闭并回到槽位
function onMenuKeydown(event: KeyboardEvent)
{
    if (event.key === 'Escape')
    {
        event.preventDefault()
        closeMenu()
        focusSlot()
        return
    }
    const offsets: Record<string, number> = {
        ArrowLeft: -1,
        ArrowRight: 1,
        ArrowUp: -MENU_COLUMN_COUNT,
        ArrowDown: MENU_COLUMN_COUNT,
    }
    const offset = offsets[event.key]
    if (offset === undefined)
    {
        return
    }
    event.preventDefault()
    const buttons = getOptionButtons()
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
    const nextIndex = index + offset
    if (index < 0)
    {
        buttons[0]?.focus()
    }
    else if (nextIndex < 0)
    {
        focusSlot()
    }
    else if (nextIndex < buttons.length)
    {
        buttons[nextIndex]?.focus()
    }
}

function pickFromMenu(category: CategoryInfo)
{
    lastPickedNumber.value = category.categoryNumber
    const wasFocusInside = menuRef.value?.contains(document.activeElement) ?? false
    closeMenu()
    // 选中的选项会从菜单里移走，焦点移回槽位（此时槽位显示的就是它）
    if (wasFocusInside)
    {
        focusSlot()
    }
    selectCategory(category)
}

// 没有可选项时（如分类总数不足）不保留打开状态
watch(hasMenu, (value) =>
{
    if (!value)
    {
        closeMenu()
    }
})

onBeforeUnmount(clearCloseTimer)
</script>

<template>
    <div v-if="categoryStore.categoryList.length" class="category-chips" role="group" aria-label="按分类筛选">
        <button type="button" :class="['chip', { active: !currentPCategoryNumber }]"
            :aria-pressed="!currentPCategoryNumber" @click="selectCategory(null)">全部</button>
        <button v-for="category in fixedCategories" :key="category.categoryNumber" type="button"
            :class="['chip', { active: currentPCategoryNumber === category.categoryNumber }]"
            :aria-pressed="currentPCategoryNumber === category.categoryNumber" @click="selectCategory(category)">
            {{ category.categoryName }}
        </button>

        <button v-if="moreCategory" ref="slotRef" type="button"
            :class="['chip', 'chip-more', { active: currentPCategoryNumber === moreCategory.categoryNumber, open: menuOpen }]"
            :aria-pressed="currentPCategoryNumber === moreCategory.categoryNumber"
            :aria-haspopup="hasMenu ? 'true' : undefined" :aria-expanded="hasMenu ? menuOpen : undefined"
            :aria-controls="hasMenu ? menuId : undefined" @mouseenter="onPointerEnter" @mouseleave="onPointerLeave"
            @focus="onSlotFocus" @blur="onFocusOut" @keydown="onSlotKeydown" @click="selectCategory(moreCategory)">
            {{ moreCategory.categoryName }}
            <svg v-if="hasMenu" class="chevron" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" stroke-width="1.4"
                    stroke-linecap="round" stroke-linejoin="round" />
            </svg>
        </button>

        <Transition name="more-menu">
            <div v-if="menuOpen" :id="menuId" ref="menuRef" class="more-menu" aria-label="更多分类"
                @mouseenter="onPointerEnter" @mouseleave="onPointerLeave" @focusout="onFocusOut"
                @keydown="onMenuKeydown">
                <button v-for="category in menuOptions" :key="category.categoryNumber" type="button"
                    class="menu-option" :title="category.categoryName" @click="pickFromMenu(category)">
                    {{ category.categoryName }}
                </button>
            </div>
        </Transition>
    </div>
</template>

<style lang="scss" scoped>
.category-chips {
    position: relative;
    display: flex;
    flex-shrink: 0;
    padding: 4px;
    border-radius: 12px;
    background: $warm-sunken;

    button {
        padding: 0;
        border: none;
        background: transparent;
        font: inherit;
        cursor: pointer;
    }
}

.category-chips .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    padding: 0 14px;
    border-radius: 9px;
    font-size: 13px;
    font-weight: 500;
    color: $warm-ink-3;
    white-space: nowrap;
    transition: background 0.2s, box-shadow 0.2s, color 0.2s;

    &:hover {
        color: $warm-ink;
    }

    &.active {
        background: $warm-card;
        box-shadow: $warm-shadow-chip;
        font-weight: 600;
        color: $warm-ink;
    }

    &:focus-visible {
        outline: 2px solid $warm-ink;
        outline-offset: 1px;
    }
}

.chevron {
    flex-shrink: 0;
    color: $warm-ink-4;
    transition: transform 0.2s ease;

    .chip-more.open & {
        transform: rotate(180deg);
    }
}

.more-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    z-index: 50;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 4px;
    min-width: 300px;
    padding: 8px;
    border-radius: 14px;
    background: $warm-card;
    box-shadow: $warm-shadow-card, 0 18px 40px -20px rgba(26, 25, 22, 0.25);
}

.category-chips .menu-option {
    padding: 8px 12px;
    border-radius: 9px;
    font-size: 13px;
    color: $warm-ink-3;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: background 0.15s, color 0.15s;

    &:hover,
    &:focus-visible {
        background: $warm-paper;
        color: $warm-ink;
    }

    &:focus-visible {
        outline: 2px solid $warm-ink;
        outline-offset: -2px;
    }
}

.more-menu-enter-active,
.more-menu-leave-active {
    transition: opacity 0.15s ease, transform 0.15s ease;
}

.more-menu-enter-from,
.more-menu-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {

    .chevron,
    .more-menu-enter-active,
    .more-menu-leave-active {
        transition: none;
    }
}
</style>
