<script lang="ts" setup>
import VideoCommentItem from '@/pages/videoDetail/features/videoCommentItem/ui/VideoCommentItem.vue';
import type { VideoComment } from '@/shared/model/VideoComment';
import unfoldSvg from '@/assets/icon/img/unfold.svg';
import { nextTick, onMounted, onUnmounted, onUpdated, ref, toRef, watch } from 'vue';
import { useVideoComment, AVATAR_HALF, CORNER_RADIUS } from '@/pages/videoDetail/widgets/videoComment/model/useVideoComment'
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

// ==================== 竖线高度动态计算 ====================
const threadRef = ref<HTMLElement | null>(null)
const childrenRef = ref<HTMLElement | null>(null)
const vertLineRef = ref<HTMLElement | null>(null)
const lineHeight = ref(0)

/** 计算竖线高度：从本评论 avatar center 延伸到最后连接点的圆角起始处 */
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
    const lastChild = childThreads[childThreads.length - 1] as HTMLElement | null

    let lastConnectionY = 0

    if (showMore)
    {
        // show-more 连接线中心高度约 20px，圆角从 20 - CORNER_RADIUS 处开始
        const showMoreTop = showMore.getBoundingClientRect().top - threadTop
        lastConnectionY = showMoreTop + 20 - CORNER_RADIUS
    } else if (lastChild)
    {
        // 最后一个子评论：avatar center = AVATAR_HALF，圆角从 AVATAR_HALF - CORNER_RADIUS 处开始
        const lastChildTop = lastChild.getBoundingClientRect().top - threadTop
        lastConnectionY = lastChildTop + AVATAR_HALF - CORNER_RADIUS
    }

    // 竖线从本评论 avatar center (AVATAR_HALF) 出发
    const height = lastConnectionY - AVATAR_HALF
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
 * 当鼠标悬浮于 show-more 时，CSS .line-hovered 会使以下元素变为黑色：
 *   ① 本层竖线        .thread-vert-line
 *   ② show-more 连接线 .show-more-connector
 *   ③ 下一层所有子评论的横向连接线 .horiz-connector（它们从本层竖线分支出去）
 *
 * 点击加载更多后 lineHovered=false，若不禁用 transition，①②③ 会 0.2s 渐变回灰，
 * 而新加载的子评论横线瞬间以灰色出现 → 视觉割裂。
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
 * 点击 "展示剩余X条评论" → 加载更多子评论。
 * 在清除 hover 前临时关闭连线 transition，使竖线颜色瞬间跳变，
 * 与新出现的子评论横线（默认灰色、无过渡）保持一致。
 */
function handleLoadMore()
{
    const targets = collectTransitionTargets()

    // ① 临时禁用 transition → 后续颜色变化为瞬间切换
    targets.forEach(el => { el.style.transition = 'none' })

    // ② 清除 hover 状态（颜色从黑色瞬间跳回灰色）
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
    <div ref="threadRef" class="comment-thread" :class="{ 'is-root': depth === 0, 'line-hovered': lineHovered }">
        <!-- 竖线：从 avatar center 向下延伸到最后一个子评论/展示更多的连接点 -->
        <div ref="vertLineRef" v-if="!collapsed && hasChildrenContent" class="thread-vert-line"
            :style="{ height: lineHeight + 'px' }">
        </div>

        <!-- 竖线点击热区 -->
        <div v-if="!collapsed && hasChildrenContent" class="thread-line-hitarea" :style="{ height: lineHeight + 'px' }"
            @click="toggleCollapse" @mouseenter="lineHovered = true" @mouseleave="lineHovered = false"></div>

        <!-- 横向连接线：从父级竖线分支到本评论的头像，点击折叠上一层 -->
        <div v-if="depth > 0" class="horiz-connector" @mouseenter="emit('line-hover')"
            @mouseleave="emit('line-unhover')" @click.stop="emit('collapseParent')"></div>

        <VideoCommentItem class="video-comment" :video-comment="comment" :folded="collapsed"
            @switch-fold="toggleCollapse" @unfold="collapsed = false" @add-comment-count="emit('addCommentCount')" />

        <!-- 子评论区域 -->
        <div v-if="!collapsed && hasChildrenContent" ref="childrenRef" class="children-container">
            <!-- 子评论递归渲染 -->
            <CommentThread v-for="(child, index) in comment.childCommentList" :key="child.commentId" :comment="child"
                :depth="depth + 1" :is-last-child="index === comment.childCommentList.length - 1 && !hasMoreToLoad"
                @load-more="(id) => emit('loadMore', id)" @collapse-parent="toggleCollapse"
                @line-hover="lineHovered = true" @line-unhover="lineHovered = false" />

            <!-- "展示剩余X条评论" 入口 -->
            <div v-if="hasMoreToLoad" class="show-more" @click="handleLoadMore" @mouseenter="lineHovered = true"
                @mouseleave="lineHovered = false">
                <div class="show-more-connector"></div>
                <div class="show-more-icon-wrapper">
                    <img :src="unfoldSvg" alt="加载更多" class="show-more-icon" />
                </div>
                <span class="show-more-text">
                    {{ remainingCount > 0 ? `展示剩余${remainingCount}条评论` : '查看更多评论' }}
                </span>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
$thread-indent: 64px; // 每层缩进 = 头像宽度
$avatar-size: 64px; // 头像尺寸
$avatar-half: 32px; // 头像半径（头像中心位置）
$line-width: 2px; // 连线粗细
$line-color: $color-neutral-3;
$line-color-hover: black;
$corner-radius: 12px; // 圆角半径

// ==================== 评论线程根容器 ====================
.comment-thread {
    position: relative;

    // 主竖线：从本评论的 avatar center 向下延伸，高度由 JS 动态计算
    .thread-vert-line {
        position: absolute;
        left: $avatar-half;
        top: $avatar-half;
        width: $line-width;
        background: $line-color;
        border-radius: 1px;
        transition: background 0.2s ease;
        pointer-events: none;
    }

    // 竖线点击热区
    .thread-line-hitarea {
        position: absolute;
        left: calc(#{$avatar-half} - 10px);
        top: $avatar-half;
        width: 22px;
        cursor: pointer;
        background: transparent;
    }

    // 横向连接线（非根评论）：从父级竖线分支到本评论头像
    // 可点击折叠上一层，与竖线构成统一的交互区域
    .horiz-connector {
        position: absolute;
        left: -$avatar-half;
        top: 0;
        width: $avatar-half;
        height: calc($avatar-half + 25px);
        border-left: $line-width solid $line-color;
        border-bottom: $line-width solid $line-color;
        border-bottom-left-radius: $corner-radius;
        cursor: pointer;
        transition: border-color 0.2s ease;

        &:hover {
            border-color: $line-color-hover;
        }
    }

    .video-comment {
        margin: 20px 0;
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
        }
    }

    // ==================== 子评论容器 ====================
    .children-container {
        position: relative;
        margin-left: $thread-indent;

        // "展示剩余X条评论" 入口
        .show-more {
            position: relative;
            display: flex;
            align-items: center;
            padding: 6px 0;
            min-height: 40px;
            cursor: pointer;

            // 连接线：从父竖线向下然后圆角转向右到图标
            .show-more-connector {
                position: absolute;
                left: -$avatar-half;
                top: 0;
                width: $avatar-half;
                height: 20px;
                border-left: $line-width solid $line-color;
                border-bottom: $line-width solid $line-color;
                border-bottom-left-radius: $corner-radius;
                transition: border-color 0.2s ease;
            }

            .show-more-icon-wrapper {
                display: flex;
                justify-content: center;
                align-items: center;
                flex-shrink: 0;

                .show-more-icon {
                    width: 20px;
                    height: 20px;
                    opacity: 0.55;
                    transition: opacity 0.2s ease, filter 0.2s ease;

                    margin-right: 20px;
                }
            }

            .show-more-text {
                font-size: 14px;
                color: $color-text-secondary;
                transition: color 0.15s ease;
            }

            &:hover {

                .show-more-connector {
                    border-color: $line-color-hover;
                }

                .show-more-icon {
                    opacity: 0.85;
                    filter: brightness(0);
                }

                .show-more-text {
                    color: $color-link;
                }
            }
        }
    }
}
</style>
