<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import type { DailyPoint } from '../model/useCcHome';

const props = defineProps<{
    /** 指标名，显示在悬浮提示里 */
    label: string,
    /** 连续的每日新增 */
    points: DailyPoint[],
}>()

// 画布尺寸和四周留白（viewBox 坐标）
const WIDTH = 1000
const HEIGHT = 300
const PAD_LEFT = 56
const PAD_RIGHT = 16
const PAD_TOP = 18
const PAD_BOTTOM = 40
const INNER_WIDTH = WIDTH - PAD_LEFT - PAD_RIGHT
const INNER_HEIGHT = HEIGHT - PAD_TOP - PAD_BOTTOM
const BASELINE = PAD_TOP + INNER_HEIGHT
/** 悬浮提示框 */
const TIP_WIDTH = 124
const TIP_HEIGHT = 46

/** 鼠标所在的那一天 */
const hovered = ref<number | null>(null)

// 换了指标就收起悬浮提示
watch(() => props.points, () =>
{
    hovered.value = null
})

/** 纵轴上限：最大值不超过 5 时固定 0~5，否则按 1 / 2 / 2.5 / 5 / 10 的倍数分成 5 格 */
function niceMax(values: number[]): { max: number, step: number }
{
    const top = Math.max(...values, 0)
    if (top <= 5) return { max: 5, step: 1 }
    const raw = top / 5
    const magnitude = Math.pow(10, Math.floor(Math.log10(raw)))
    const step = [1, 2, 2.5, 5, 10].map(x => x * magnitude).find(x => x >= raw) ?? 10 * magnitude
    return { max: step * 5, step }
}

/** 纵轴刻度：1 万以上用「万」 */
function axisLabel(value: number): string
{
    return value >= 10000 ? `${value / 10000}万` : String(value)
}

const scale = computed(() => niceMax(props.points.map(point => point.value)))

const columnWidth = computed(() => INNER_WIDTH / Math.max(props.points.length, 1))

function xOf(index: number): number
{
    return PAD_LEFT + columnWidth.value * (index + 0.5)
}

function yOf(value: number): number
{
    return BASELINE - (value / scale.value.max) * INNER_HEIGHT
}

/** 6 条横向网格线（第一条是底线）和左侧刻度 */
const gridLines = computed(() => Array.from({ length: 6 }, (_, j) =>
{
    const value = scale.value.step * j
    return { y: yOf(value), label: axisLabel(value), base: j === 0 }
}))

/** 每天的点：横轴只显示 MM-DD */
const dots = computed(() => props.points.map((point, index) => ({
    x: xOf(index),
    y: yOf(point.value),
    day: point.date.slice(5),
})))

const linePath = computed(() => dots.value.length === 0
    ? ''
    : 'M' + dots.value.map(dot => `${dot.x},${dot.y}`).join(' L'))

const areaPath = computed(() =>
{
    const count = dots.value.length
    if (count === 0) return ''
    return `${linePath.value} L${xOf(count - 1)},${BASELINE} L${xOf(0)},${BASELINE} Z`
})

/** 悬浮提示：左右不超出绘图区，上面最多顶到画布上沿 */
const tooltip = computed(() =>
{
    const index = hovered.value
    const point = index === null ? undefined : props.points[index]
    if (index === null || !point) return null

    const centerX = xOf(index)
    return {
        guideX: centerX,
        x: Math.min(Math.max(centerX, PAD_LEFT + 64), WIDTH - PAD_RIGHT - 64),
        y: Math.max(yOf(point.value) - 62, PAD_TOP - 6),
        date: point.date,
        text: `${props.label} +${point.value.toLocaleString('en-US')}`,
    }
})

/** 读屏用的数据摘要 */
const ariaLabel = computed(() =>
    `${props.label}近 7 天每日新增：${props.points.map(point => `${point.date} +${point.value}`).join('，')}`)
</script>

<template>
    <svg class="trend-svg" :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" role="img" :aria-label="ariaLabel"
        @mouseleave="hovered = null">
        <g v-for="(line, j) in gridLines" :key="`g${j}`">
            <line :class="['grid-line', { base: line.base }]" :x1="PAD_LEFT" :x2="WIDTH - PAD_RIGHT" :y1="line.y"
                :y2="line.y" />
            <text class="axis-label" :x="PAD_LEFT - 14" :y="line.y + 4" text-anchor="end">{{ line.label }}</text>
        </g>

        <text v-for="(dot, index) in dots" :key="`d${index}`" :class="['axis-label', { active: index === hovered }]"
            :x="dot.x" :y="HEIGHT - 12" text-anchor="middle">{{ dot.day }}</text>

        <path class="area" :d="areaPath" />
        <line v-if="tooltip" class="guide" :x1="tooltip.guideX" :x2="tooltip.guideX" :y1="PAD_TOP" :y2="BASELINE" />
        <path class="line" :d="linePath" />
        <circle v-for="(dot, index) in dots" :key="`c${index}`" class="dot" :cx="dot.x" :cy="dot.y"
            :r="index === hovered ? 7 : 5" />

        <g v-if="tooltip" class="tooltip">
            <rect :x="tooltip.x - TIP_WIDTH / 2" :y="tooltip.y" :width="TIP_WIDTH" :height="TIP_HEIGHT" rx="14" />
            <text class="tooltip-date" :x="tooltip.x" :y="tooltip.y + 18" text-anchor="middle">{{ tooltip.date }}</text>
            <text class="tooltip-value" :x="tooltip.x" :y="tooltip.y + 36" text-anchor="middle">{{ tooltip.text }}</text>
        </g>

        <!-- 每天一整列的透明感应区 -->
        <rect v-for="(_, index) in dots" :key="`h${index}`" :x="PAD_LEFT + columnWidth * index" y="0"
            :width="columnWidth" :height="HEIGHT" fill="transparent" @mouseenter="hovered = index" />
    </svg>
</template>

<style lang="scss" scoped>
.trend-svg {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
}

.grid-line {
    stroke: rgba(11, 12, 18, 0.07);

    &.base {
        stroke: rgba(11, 12, 18, 0.2);
    }
}

.axis-label {
    font-family: $warm-font-mono;
    font-size: 12px;
    fill: $warm-ink-4;

    &.active {
        font-weight: 600;
        fill: $warm-accent;
    }
}

.area {
    fill: rgba(0, 0, 242, 0.07);
}

.guide {
    stroke: rgba(0, 0, 242, 0.3);
    stroke-dasharray: 4 4;
}

.line {
    fill: none;
    stroke: $warm-accent;
    stroke-width: 3;
    stroke-linejoin: round;
    stroke-linecap: round;
}

.dot {
    fill: #FFFFFF;
    stroke: $warm-accent;
    stroke-width: 3;
}

.tooltip {
    pointer-events: none;

    rect {
        fill: $warm-ink;
    }
}

.tooltip-date {
    font-family: $warm-font-mono;
    font-size: 11px;
    fill: $warm-accent-on-dark-2;
}

.tooltip-value {
    font-size: 14px;
    font-weight: 700;
    fill: #FFFFFF;
}
</style>
