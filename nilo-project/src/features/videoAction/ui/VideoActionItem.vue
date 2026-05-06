<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';
import { useVideoAction } from '../model/useVideoAction';
import { UserVideoAction } from '@/shared/constant/UserVideoActionEnum';
import { useVideoActionUiStore } from '../store/VideoActionUiStore';

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

function startAnimation(actionType: number) {
    const next = new Set(animatingActions.value)
    next.add(actionType)
    animatingActions.value = next
    setTimeout(() => {
        const next2 = new Set(animatingActions.value)
        next2.delete(actionType)
        animatingActions.value = next2
    }, ANIMATION_DURATION)
}

function isAnimating(actionType: number): boolean {
    return animatingActions.value.has(actionType)
}

// 监听投币动画触发器（由 CoinDialog 在投币成功后调用）
watch(() => videoActionUiStore.coinAnimationTrigger, () => {
    startAnimation(UserVideoAction.coin)
})

async function handleAction(actionType: number, coinAmount?: number) {
    if (isAnimating(actionType)) return
    if (!checkLogin()) return

    // 点赞/收藏可取消：只在"执行"时（当前未点赞/未收藏）播放动画，取消时不播放
    const isToggleOn =
        (actionType === UserVideoAction.like && !videoActionState.liked) ||
        (actionType === UserVideoAction.collect && !videoActionState.collected)

    if (isToggleOn) {
        startAnimation(actionType)
    }

    await doVideoAction(actionType, coinAmount)
    emit('action-done')
}

/** 投币按钮点击：动画播放期间阻止打开投币弹窗 */
function handleCoinClick() {
    if (isAnimating(UserVideoAction.coin)) return
    openCoinDialog()
}

onMounted(() => {
    getVideoAction()
})
</script>

<template>
    <div class="video-action-items">
        <!-- 点赞 -->
        <div :class="['video-action-item', { 'animating-like': isAnimating(UserVideoAction.like) }]"
            @click="handleAction(UserVideoAction.like)">
            <div
                :class="['iconfont', 'icon-like-solid', { toggled: videoActionState.liked, untoggled: !videoActionState.liked }]">
            </div>
            <p class="label">{{ videoState.videoInfo.likeCount }}</p>
        </div>

        <!-- 投币 -->
        <div :class="['video-action-item', { 'animating-coin': isAnimating(UserVideoAction.coin) }]"
            @click="handleCoinClick()">
            <div :class="['iconfont', 'icon-toubi', {
                toggled: videoActionState.coin > 0, untoggled:
                    videoActionState.coin === 0
            }]">
            </div>
            <p class="label">{{ videoState.videoInfo.coinCount }}</p>
        </div>

        <!-- 收藏 -->
        <div :class="['video-action-item', { 'animating-collect': isAnimating(UserVideoAction.collect) }]"
            @click="handleAction(UserVideoAction.collect)">
            <div
                :class="['iconfont', 'icon-collection-solid', { toggled: videoActionState.collected, untoggled: !videoActionState.collected }]">
            </div>
            <p class="label">{{ videoState.videoInfo.collectCount }}</p>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.video-action-items {
    padding: 10px 0;
    border-top: 1px solid $color-border;
    border-bottom: 1px solid $color-border;

    display: flex;
    column-gap: 40px;
    flex-direction: row;
    vertical-align: middle;

    .video-action-item {
        display: flex;
        flex-direction: row;
        column-gap: 10px;
        // 为投币的 3D Y轴旋转提供透视（perspective 需设在父元素上）
        perspective: 400px;

        .iconfont {
            font-size: 40px;
            cursor: pointer;

            &.toggled {
                color: $color-bilibili-blue;
            }

            &.untoggled {
                color: $color-text-secondary;
            }
        }

        .label {
            color: $color-text-secondary;
            font-size: 16px;
            line-height: 16px;
        }

        // ==================== 动画中禁用点击 ====================
        &.animating-like,
        &.animating-coin,
        &.animating-collect {
            pointer-events: none;

            .iconfont {
                cursor: default;
            }
        }

        // ==================== 点赞动画：逆时针旋转 + 向右上角移动并放大 → 回到原位 ====================
        &.animating-like .iconfont {
            animation: like-animation 1s ease-in-out;
        }

        // ==================== 投币动画：沿 Y 轴旋转 3 圈 ====================
        &.animating-coin .iconfont {
            animation: coin-animation 1s ease-in-out;
            transform-style: preserve-3d;
        }

        // ==================== 收藏动画：向上弹跳 3 下 ====================
        &.animating-collect .iconfont {
            animation: collect-animation 1s ease-in-out;
        }
    }
}

// ==================== 关键帧定义 ====================

@keyframes like-animation {
    0% {
        transform: rotate(0deg) translate(0, 0) scale(1);
    }

    10% {
        // 开始逆时针旋转并向右上角移动、放大
        transform: rotate(-15deg) translate(3px, -5px) scale(1.2);
    }

    20% {
        // 达到最大幅度：逆时针 -45°，最大位移和放大
        transform: rotate(-45deg) translate(10px, -14px) scale(1.5);
    }

    35% {
        // 开始回弹，略微过冲
        transform: rotate(-25deg) translate(5px, -8px) scale(1.3);
    }

    50% {
        // 反向微摆，制造弹性效果
        transform: rotate(5deg) translate(-2px, 2px) scale(0.95);
    }

    65% {
        // 再次小幅逆时针
        transform: rotate(-8deg) translate(2px, -3px) scale(1.05);
    }

    80% {
        // 趋于稳定
        transform: rotate(-2deg) translate(0px, -1px) scale(1.01);
    }

    100% {
        transform: rotate(0deg) translate(0, 0) scale(1);
    }
}

@keyframes coin-animation {
    0% {
        transform: rotateY(0deg);
    }

    100% {
        // 沿 Y 轴旋转 3 圈 = 1080°
        transform: rotateY(1080deg);
    }
}

@keyframes collect-animation {

    0%,
    100% {
        transform: translateY(0);
    }

    // 第 1 跳（最高）
    12% {
        transform: translateY(-14px);
    }

    24% {
        transform: translateY(0);
    }

    // 第 2 跳（稍低）
    36% {
        transform: translateY(-10px);
    }

    48% {
        transform: translateY(0);
    }

    // 第 3 跳（最低）
    60% {
        transform: translateY(-5px);
    }

    72% {
        transform: translateY(0);
    }
}
</style>
