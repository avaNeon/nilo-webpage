<script lang="ts" setup>
import { computed } from 'vue';

const props = defineProps<{
    /** 总条数 */
    total: number,
    pageSize: number,
}>()

/** 当前页，从 1 开始 */
const page = defineModel<number>({ required: true })

const pageCount = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

/** 页码按钮：不超过 7 页全显示；否则首页、末页、当前页前后各一页，中间用 … 隔开（0 表示省略号） */
const pageItems = computed<number[]>(() =>
{
    const total = pageCount.value
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

    const current = page.value
    const kept = [...new Set([1, total, current - 1, current, current + 1])]
        .filter(p => p >= 1 && p <= total)
        .sort((a, b) => a - b)
    const items: number[] = []
    let last = 0
    for (const p of kept)
    {
        if (p - last > 1) items.push(0)
        items.push(p)
        last = p
    }
    return items
})

function go(target: number)
{
    const next = Math.min(Math.max(target, 1), pageCount.value)
    if (next !== page.value) page.value = next
}
</script>

<template>
    <!-- 列表底部：左边条数说明，右边胶囊分页 -->
    <div class="cc-pager">
        <span class="pager-info">共 {{ total }} 条 · 每页 {{ pageSize }} 条</span>
        <nav class="pager-pill" aria-label="分页">
            <button type="button" class="arrow" :disabled="page <= 1" aria-label="上一页" @click="go(page - 1)">←</button>
            <template v-for="(item, index) in pageItems" :key="item === 0 ? `gap-${index}` : item">
                <span v-if="item === 0" class="gap">…</span>
                <button v-else type="button" :class="['page', { active: item === page }]"
                    :aria-current="item === page ? 'page' : undefined" @click="go(item)">{{ item }}</button>
            </template>
            <button type="button" class="arrow" :disabled="page >= pageCount" aria-label="下一页"
                @click="go(page + 1)">→</button>
        </nav>
    </div>
</template>

<style lang="scss" scoped>
@use '@/pages/creativeCenter/shared/styles/cc' as *;

.cc-pager {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-top: 8px;
    padding-top: 20px;
    border-top: 1px solid $cc-line;
}

.pager-info {
    font-size: 13px;
    color: $warm-ink-3;
}

.pager-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px;
    border-radius: 999px;
    background: $warm-sunken;
}

.arrow,
.page,
.gap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
}

.arrow {
    @include reset-button;
    color: $warm-ink;
    font-size: 15px;

    &:disabled {
        color: $warm-ink-5;
    }
}

.page {
    @include reset-button;
    color: $warm-ink-2;
    font-size: 13px;
    font-weight: 600;
    transition: background-color 0.2s, color 0.2s;

    &:hover:not(.active) {
        background: #FFFFFF;
    }

    &.active {
        background: $warm-ink;
        color: #FFFFFF;
        cursor: default;
    }
}

.gap {
    color: $warm-ink-4;
    font-size: 13px;
}
</style>
