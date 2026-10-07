<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';
import { useVideoAction } from '../model/useVideoAction';
import { UserVideoAction } from '@/shared/constant/UserVideoActionEnum';
import { useVideoActionUiStore } from '../store/VideoActionUiStore';
import { formatCount } from '@/shared/utils/NumberUtil';
import message from '@/shared/lib/message';

const { videoActionState, videoState, getVideoAction, doVideoAction, checkLogin, openCoinDialog } = useVideoAction()
const videoActionUiStore = useVideoActionUiStore()

const emit = defineEmits<{ 'action-done': [] }>()

/**
 * 当前正在播放动画的操作类型集合。
 * 动画期间对应按钮不可点击，防止用户狂按浪费服务器资源。
 */
const animatingActions = ref(new Set<number>())

/** 动画持续时间（ms），需 ≥ CSS 动画时长以保证动画完整播放 */
const ANIMATION_DURATION = 1200

function startAnimation(actionType: number)
{
    const next = new Set(animatingActions.value)
    next.add(actionType)
    animatingActions.value = next
    setTimeout(() =>
    {
        const next2 = new Set(animatingActions.value)
        next2.delete(actionType)
        animatingActions.value = next2
    }, ANIMATION_DURATION)
}

function isAnimating(actionType: number): boolean
{
    return animatingActions.value.has(actionType)
}

// 监听投币动画触发器（由 CoinDialog 在投币成功后调用）
watch(() => videoActionUiStore.coinAnimationTrigger, () =>
{
    startAnimation(UserVideoAction.coin)
})

async function handleAction(actionType: number, coinAmount?: number)
{
    if (isAnimating(actionType)) return
    if (!checkLogin()) return

    // 点赞/收藏可取消：只在"执行"时（当前未点赞/未收藏）播放动画，取消时不播放
    const isToggleOn =
        (actionType === UserVideoAction.like && !videoActionState.liked) ||
        (actionType === UserVideoAction.collect && !videoActionState.collected)

    if (isToggleOn)
    {
        startAnimation(actionType)
    }

    await doVideoAction(actionType, coinAmount)
    emit('action-done')
}

/** 投币按钮点击：动画播放期间阻止打开投币弹窗 */
function handleCoinClick()
{
    if (isAnimating(UserVideoAction.coin)) return
    openCoinDialog()
}

/** 分享：复制当前视频链接（去掉 ?t= 跳转参数） */
async function handleShare()
{
    const url = new URL(window.location.href)
    url.searchParams.delete('t')
    url.hash = ''
    try
    {
        await navigator.clipboard.writeText(url.toString())
        message.success('链接已复制')
    }
    catch
    {
        message.warning('复制失败，请手动复制地址栏链接')
    }
}

onMounted(() =>
{
    getVideoAction()
})
</script>

<template>
    <div class="video-action-items">
        <!-- 排在最前面的额外按钮（AI 总结），由页面传入 -->
        <slot name="leading"></slot>

        <!-- 点赞 -->
        <button type="button"
            :class="['video-action-item', { active: videoActionState.liked, 'animating-like': isAnimating(UserVideoAction.like) }]"
            @click="handleAction(UserVideoAction.like)">
            <span v-if="videoActionState.liked" class="dot"></span>
            <span class="label">{{ videoActionState.liked ? '已赞' : '点赞' }}</span>
            <span class="count">{{ formatCount(videoState.videoInfo.likeCount) }}</span>
        </button>

        <!-- 投币 -->
        <button type="button"
            :class="['video-action-item', { active: videoActionState.coin > 0, 'animating-coin': isAnimating(UserVideoAction.coin) }]"
            @click="handleCoinClick()">
            <span v-if="videoActionState.coin > 0" class="dot"></span>
            <span class="label">{{ videoActionState.coin > 0 ? '已投币' : '投币' }}</span>
            <span class="count">{{ formatCount(videoState.videoInfo.coinCount) }}</span>
        </button>

        <!-- 收藏 -->
        <button type="button"
            :class="['video-action-item', { active: videoActionState.collected, 'animating-collect': isAnimating(UserVideoAction.collect) }]"
            @click="handleAction(UserVideoAction.collect)">
            <span v-if="videoActionState.collected" class="dot"></span>
            <span class="label">{{ videoActionState.collected ? '已收藏' : '收藏' }}</span>
            <span class="count">{{ formatCount(videoState.videoInfo.collectCount) }}</span>
        </button>

        <!-- 分享 -->
        <button type="button" class="video-action-item" @click="handleShare">
            <span class="label">分享</span>
        </button>
    </div>
</template>

<style lang="scss" scoped>
// 每个操作一个浅灰胶囊；点过的换浅蓝底 + 蓝字
.video-action-items {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    gap: 8px;

    .video-action-item {
        height: 40px;
        padding: 0 16px;
        display: flex;
        align-items: center;
        gap: 8px;
        border: none;
        border-radius: 999px;
        background: $warm-sunken;
        color: $warm-ink;
        font-size: 13px;
        font-weight: 500;
        white-space: nowrap;
        cursor: pointer;
        transition: background-color 0.2s, color 0.2s;
        // 为投币的 3D Y轴旋转提供透视（perspective 需设在父元素上）
        perspective: 400px;

        &:hover {
            background: #E9EBF0;
        }

        &:focus-visible {
            outline: 2px solid $warm-accent;
            outline-offset: 2px;
        }

        .count {
            color: $warm-ink-4;
        }

        .dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            flex-shrink: 0;
            background: $warm-accent;
        }

        &.active {
            background: $warm-accent-soft;
            color: $warm-accent-text;

            .count {
                color: inherit;
            }
        }

        // ==================== 动画中禁用点击 ====================
        &.animating-like,
        &.animating-coin,
        &.animating-collect {
            pointer-events: none;
            cursor: default;
        }

        // ==================== 点赞动画：圆点弹出并扩散一圈 ====================
        &.animating-like {
            .dot {
                animation: like-dot-animation 1s ease-out;
            }

            .label {
                animation: label-pop-animation 0.5s ease-out;
            }
        }

        // ==================== 投币动画：圆点沿 Y 轴旋转 3 圈 ====================
        &.animating-coin {
            .dot {
                animation: coin-animation 1s ease-in-out;
                transform-style: preserve-3d;
            }

            .label {
                animation: label-pop-animation 0.5s ease-out;
            }
        }

        // ==================== 收藏动画：圆点向上弹跳 3 下 ====================
        &.animating-collect {
            .dot {
                animation: collect-animation 1s ease-in-out;
            }

            .label {
                animation: label-pop-animation 0.5s ease-out;
            }
        }
    }
}

// ==================== 关键帧定义 ====================

@keyframes like-dot-animation {
    0% {
        transform: scale(0.2);
        box-shadow: 0 0 0 0 rgba(0, 0, 242, 0.45);
    }

    25% {
        transform: scale(1.8);
    }

    50% {
        transform: scale(0.9);
    }

    100% {
        transform: scale(1);
        box-shadow: 0 0 0 8px rgba(0, 0, 242, 0);
    }
}

@keyframes label-pop-animation {
    0%,
    100% {
        transform: scale(1);
    }

    40% {
        transform: scale(1.08);
    }
}

@keyframes coin-animation {
    0% {
        transform: rotateY(0deg) scale(1.6);
    }

    100% {
        // 沿 Y 轴旋转 3 圈 = 1080°
        transform: rotateY(1080deg) scale(1);
    }
}

@keyframes collect-animation {

    0%,
    100% {
        transform: translateY(0);
    }

    // 第 1 跳（最高）
    12% {
        transform: translateY(-8px);
    }

    24% {
        transform: translateY(0);
    }

    // 第 2 跳（稍低）
    36% {
        transform: translateY(-5px);
    }

    48% {
        transform: translateY(0);
    }

    // 第 3 跳（最低）
    60% {
        transform: translateY(-3px);
    }

    72% {
        transform: translateY(0);
    }
}
</style>
