<script lang="ts" setup>
import VideoCommentItem from '@/pages/videoDetail/features/videoCommentItem/ui/VideoCommentItem.vue';
import type { VideoComment } from '@/shared/model/VideoComment';
import { computed, nextTick, onMounted, onUnmounted, onUpdated, ref, toRef, watch } from 'vue';
import { useVideoComment, getThreadMetrics, LINE_WIDTH, CORNER_RADIUS, LINE_GAP, SHOW_MORE_CENTER } from '@/pages/videoDetail/widgets/videoComment/model/useVideoComment'
import { calcDefaultFoldReason } from '@/pages/videoDetail/features/videoCommentItem/model/useVideoCommentItem'

const props = withDefaults(defineProps<{
    comment: VideoComment,
    depth?: number,
    /** 是否是同级的最后一个子评论（且下方没有 "展示更多" 入口） */
    isLastChild?: boolean
}>(), {
    depth: 0,
    isLastChild: false
})

const emit = defineEmits<{
    (e: 'loadMore', commentId: string): void
    /** 横向连接线被点击 → 通知父级折叠 */
    (e: 'collapseParent'): void
    (e: 'line-hover'): void
    (e: 'line-unhover'): void
    (e: 'addCommentCount'): void
}>()

/** 当前节点是否折叠（根据默认折叠原因初始化） */
const collapsed = ref(calcDefaultFoldReason(props.comment) !== 0)

const { remainingCount, hasMoreToLoad, hasChildrenContent } = useVideoComment(toRef(props, 'comment'))

function toggleCollapse()
{
    collapsed.value = !collapsed.value
    lineHovered.value = false
}

// ==================== 连线几何 ====================
// 坐标都以当前线程根节点左上角为原点，头像尺寸来自 COMMENT_AVATAR_METRICS
const metrics = computed(() => getThreadMetrics(props.depth))
const parentMetrics = computed(() => getThreadMetrics(props.depth - 1))
const childMetrics = computed(() => getThreadMetrics(props.depth + 1))

/** 竖线起点：头像底部再留出 LINE_GAP */
const lineTop = computed(() => metrics.value.avatarTop + metrics.value.avatarSize + LINE_GAP)

const threadStyle = computed(() =>
{
    const m = metrics.value
    const p = parentMetrics.value
    const half = LINE_WIDTH / 2
    return {
        '--line-width': `${LINE_WIDTH}px`,
        '--corner-radius': `${CORNER_RADIUS}px`,
        // 本层竖线：与头像中心对齐
        '--vert-left': `${m.centerX - half}px`,
        '--vert-top': `${lineTop.value}px`,
        // 子评论缩进：子评论头像与本评论正文左对齐
        '--indent': `${m.indent}px`,
        // 横向连接线：从父级竖线拐向本评论头像，止于头像左侧 LINE_GAP 处
        '--connector-left': `${p.centerX - half - p.indent}px`,
        '--connector-width': `${p.indent - p.centerX + half - LINE_GAP}px`,
        '--connector-height': `${m.centerY + half}px`,
        // "展开更多回复" 的连接线（位于本层子评论区内）
        '--more-left': `${m.centerX - half - m.indent}px`,
        '--more-width': `${m.indent - m.centerX + half - LINE_GAP}px`,
        '--more-height': `${SHOW_MORE_CENTER + half}px`,
    }
})

// ==================== 竖线高度动态计算 ====================
const threadRef = ref<HTMLElement | null>(null)
const childrenRef = ref<HTMLElement | null>(null)
const vertLineRef = ref<HTMLElement | null>(null)
const lineHeight = ref(0)

/** 计算竖线高度：从本评论头像下方延伸到最后一个连接点的圆角起始处 */
function calcLineHeight()
{
    if (!threadRef.value || !childrenRef.value)
    {
        lineHeight.value = 0
        return
    }

    const threadEl = threadRef.value
    const childrenEl = childrenRef.value

    // 以 threadEl 作为基准坐标系，使用 getBoundingClientRect 保证跨层级准确
    const threadTop = threadEl.getBoundingClientRect().top

    // 找到最后一个连接点：优先 show-more，否则最后一个直接子评论
    // 注意：必须用 :scope > 限定只选直接子级，避免匹配到嵌套层级的 .show-more
    const showMore = childrenEl.querySelector(':scope > .show-more') as HTMLElement | null
    const childThreads = childrenEl.querySelectorAll(':scope > .comment-thread')
    const lastChild = childThreads[childThreads.length - 1] as HTMLElement | undefined

    let lastConnectionY = 0

    if (showMore)
    {
        const showMoreTop = showMore.getBoundingClientRect().top - threadTop
        lastConnectionY = showMoreTop + SHOW_MORE_CENTER - CORNER_RADIUS
    } else if (lastChild)
    {
        const lastChildTop = lastChild.getBoundingClientRect().top - threadTop
        lastConnectionY = lastChildTop + childMetrics.value.centerY - CORNER_RADIUS
    }

    const height = lastConnectionY - lineTop.value
    lineHeight.value = height > 0 ? height : 0
}

let resizeObserver: ResizeObserver | null = null

onMounted(() =>
{
    calcLineHeight()
    // 使用 ResizeObserver 监听尺寸变化
    if (threadRef.value)
    {
        resizeObserver = new ResizeObserver(() =>
        {
            calcLineHeight()
        })
        resizeObserver.observe(threadRef.value)
    }
})

onUpdated(() =>
{
    nextTick(calcLineHeight)
})

onUnmounted(() =>
{
    resizeObserver?.disconnect()
})

// 当折叠状态或子评论变化时重新计算
watch([collapsed, () => props.comment.childCommentList?.length], () =>
{
    nextTick(calcLineHeight)
})

/** hover 状态 */
const lineHovered = ref(false)

/**
 * 收集加载更多时所有受 hover 影响的连线元素，统一禁用 transition。
 *
 * 当鼠标悬浮于 show-more 时，CSS .line-hovered 会使以下元素变深：
 *   ① 本层竖线        .thread-vert-line
 *   ② show-more 连接线 .show-more-connector
 *   ③ 下一层所有子评论的横向连接线 .horiz-connector（它们从本层竖线分支出去）
 *
 * 点击加载更多后 lineHovered=false，若不禁用 transition，①②③ 会 0.2s 渐变回浅色，
 * 而新加载的子评论横线瞬间以浅色出现 → 视觉割裂。
 */
function collectTransitionTargets(): HTMLElement[]
{
    const targets: HTMLElement[] = []

    // ① 本层竖线
    if (vertLineRef.value)
    {
        targets.push(vertLineRef.value)
    }

    if (childrenRef.value)
    {
        // ② show-more 的连接线
        const showMoreConnector = childrenRef.value.querySelector(':scope > .show-more > .show-more-connector') as HTMLElement | null
        if (showMoreConnector)
        {
            targets.push(showMoreConnector)
        }

        // ③ 下一层所有已有子评论的横向连接线
        const childConnectors = childrenRef.value.querySelectorAll(':scope > .comment-thread > .horiz-connector')
        childConnectors.forEach(el => targets.push(el as HTMLElement))
    }

    return targets
}

/**
 * 点击 "展开更多回复" → 加载更多子评论。
 * 在清除 hover 前临时关闭连线 transition，使竖线颜色瞬间跳变，
 * 与新出现的子评论横线（默认浅色、无过渡）保持一致。
 */
function handleLoadMore()
{
    const targets = collectTransitionTargets()

    // ① 临时禁用 transition → 后续颜色变化为瞬间切换
    targets.forEach(el => { el.style.transition = 'none' })

    // ② 清除 hover 状态（颜色瞬间跳回浅色）
    lineHovered.value = false

    // ③ 通知父级请求加载子评论
    emit('loadMore', props.comment.commentId)

    // ④ 等待新子评论渲染完成后恢复 transition
    nextTick(() =>
    {
        // 强制重绘提交 instant 变更，避免恢复 transition 时触发回流重绘
        targets.forEach(el => { void el.offsetHeight })
        targets.forEach(el => { el.style.transition = '' })
    })
}
</script>

<template>
    <div ref="threadRef" class="comment-thread" :class="{ 'is-root': depth === 0, 'line-hovered': lineHovered }"
        :style="threadStyle">
        <!-- 竖线：从头像下方向下延伸到最后一个子评论/展开更多的连接点 -->
        <div ref="vertLineRef" v-if="!collapsed && hasChildrenContent" class="thread-vert-line"
            :style="{ height: lineHeight + 'px' }">
        </div>

        <!-- 竖线点击热区 -->
        <div v-if="!collapsed && hasChildrenContent" class="thread-line-hitarea" :style="{ height: lineHeight + 'px' }"
            @click="toggleCollapse" @mouseenter="lineHovered = true" @mouseleave="lineHovered = false"></div>

        <!-- 横向连接线：从父级竖线分支到本评论的头像，点击折叠上一层 -->
        <div v-if="depth > 0" class="horiz-connector" @mouseenter="emit('line-hover')"
            @mouseleave="emit('line-unhover')" @click.stop="emit('collapseParent')"></div>

        <VideoCommentItem :video-comment="comment" :folded="collapsed" @switch-fold="toggleCollapse"
            @unfold="collapsed = false" @add-comment-count="emit('addCommentCount')" />

        <!-- 子评论区域 -->
        <div v-if="!collapsed && hasChildrenContent" ref="childrenRef" class="children-container">
            <!-- 子评论递归渲染 -->
            <CommentThread v-for="(child, index) in comment.childCommentList" :key="child.commentId" :comment="child"
                :depth="depth + 1" :is-last-child="index === comment.childCommentList.length - 1 && !hasMoreToLoad"
                @load-more="(id) => emit('loadMore', id)" @collapse-parent="toggleCollapse"
                @line-hover="lineHovered = true" @line-unhover="lineHovered = false"
                @add-comment-count="emit('addCommentCount')" />

            <!-- "展开更多回复" 入口 -->
            <button v-if="hasMoreToLoad" type="button" class="show-more" @click="handleLoadMore"
                @mouseenter="lineHovered = true" @mouseleave="lineHovered = false">
                <span class="show-more-connector"></span>
                <span class="show-more-icon"></span>
                <span class="show-more-text">
                    {{ remainingCount > 0 ? `展开剩余 ${remainingCount} 条回复` : '展开更多回复' }}
                </span>
            </button>
        </div>
    </div>
</template>

<style lang="scss" scoped>
// 连线颜色：浅冷灰，悬停整条线程变蓝
// 用不透明色，避免竖线与连接线重叠的地方颜色加深
$line-color: #E4E6EB;
$line-color-hover: $warm-accent;

// ==================== 评论线程根容器 ====================
.comment-thread {
    position: relative;

    // 主竖线：从本评论头像下方向下延伸，高度由 JS 动态计算
    .thread-vert-line {
        position: absolute;
        left: var(--vert-left);
        top: var(--vert-top);
        width: var(--line-width);
        background: $line-color;
        border-radius: 1px;
        transition: background 0.2s ease;
        pointer-events: none;
    }

    // 竖线点击热区
    .thread-line-hitarea {
        position: absolute;
        left: calc(var(--vert-left) - 10px);
        top: var(--vert-top);
        width: calc(var(--line-width) + 20px);
        cursor: pointer;
        background: transparent;
    }

    // 横向连接线（非根评论）：从父级竖线分支到本评论头像
    // 可点击折叠上一层，与竖线构成统一的交互区域
    .horiz-connector {
        position: absolute;
        left: var(--connector-left);
        top: 0;
        width: var(--connector-width);
        height: var(--connector-height);
        border-left: var(--line-width) solid $line-color;
        border-bottom: var(--line-width) solid $line-color;
        border-bottom-left-radius: var(--corner-radius);
        cursor: pointer;
        transition: border-color 0.2s ease;

        &:hover {
            border-color: $line-color-hover;
        }
    }

    // -------------------- hover 高亮交互 --------------------
    &.line-hovered {
        >.thread-vert-line {
            background: $line-color-hover;
        }

        >.children-container {
            >.comment-thread>.horiz-connector {
                border-color: $line-color-hover;
            }

            >.show-more>.show-more-connector {
                border-color: $line-color-hover;
            }

            >.show-more>.show-more-icon {
                box-shadow: inset 0 0 0 1.5px $line-color-hover;
            }
        }
    }

    // ==================== 子评论容器 ====================
    .children-container {
        position: relative;
        margin-left: var(--indent);

        // "展开更多回复" 入口：上内边距 8 + 内容行高 28，图标中心与 SHOW_MORE_CENTER 对应
        .show-more {
            position: relative;
            display: flex;
            align-items: center;
            gap: 10px;
            width: fit-content;
            height: 36px;
            padding: 8px 0 0;
            border: none;
            background: transparent;
            font: inherit;
            color: $warm-ink-3;
            cursor: pointer;
            transition: color 0.15s ease;

            // 连接线：从父竖线向下然后圆角转向右到图标
            .show-more-connector {
                position: absolute;
                left: var(--more-left);
                top: 0;
                width: var(--more-width);
                height: var(--more-height);
                border-left: var(--line-width) solid $line-color;
                border-bottom: var(--line-width) solid $line-color;
                border-bottom-left-radius: var(--corner-radius);
                transition: border-color 0.2s ease;
            }

            // 圆环 + 加号
            .show-more-icon {
                position: relative;
                flex-shrink: 0;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                box-shadow: inset 0 0 0 1.5px $line-color;
                transition: box-shadow 0.2s ease;

                &::before,
                &::after {
                    content: '';
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    width: 8px;
                    height: 1.5px;
                    margin: -0.75px 0 0 -4px;
                    border-radius: 1px;
                    background: currentColor;
                }

                &::after {
                    transform: rotate(90deg);
                }
            }

            .show-more-text {
                font-size: 12px;
                font-weight: 500;
                line-height: 28px;
            }

            &:hover,
            &:focus-visible {
                color: $warm-accent;
                outline: none;

                .show-more-connector {
                    border-color: $line-color-hover;
                }

                .show-more-icon {
                    box-shadow: inset 0 0 0 1.5px $line-color-hover;
                }
            }
        }
    }
}
</style>
