<script lang="ts" setup>
import { UserVideoAction } from '@/shared/constant/UserVideoActionEnum';
import { useVideoAction } from '../model/useVideoAction';
import { useVideoActionUiStore } from '../store/VideoActionUiStore';
import coin1 from '@/assets/coin1.png'
import coin2 from '@/assets/coin2.png'

const { coinAmount, updateCoinAmount, doVideoAction, checkLogin, videoActionState } = useVideoAction()
const videoActionUiStore = useVideoActionUiStore()

const emit = defineEmits<{ 'action-done': [] }>()

async function handleAction(actionType: number, coinAmount?: number) {
    if (!checkLogin()) {
        return
    }
    // 记录投币前的数量，用于判断是否真正投币成功
    const coinBefore = videoActionState.coin
    await doVideoAction(actionType, coinAmount)
    // let upper layer update video info (including video action status)
    emit('action-done')
    videoActionUiStore.closeCoinDialog()
    // 只在投币数量确实增加时才触发动画（确保是有效投币，而非重复请求被后端拒绝）
    if (videoActionState.coin > coinBefore) {
        videoActionUiStore.triggerCoinAnimation()
    }
}
</script>

<template>
    <el-dialog class="dialog" v-model="videoActionUiStore.coinVisible" width="500">
        <div class="title">
            <span>为UP主投上</span>
            <span class="number">
                {{ coinAmount }}
            </span>
            <span>枚硬币</span>
        </div>
        <div class="content">
            <div :class="['coin-item', { active: coinAmount === 1 }]" @click="updateCoinAmount(1)">
                <img class="image" :src="coin1" alt="Coin 1">
                <p class="label">1硬币</p>
            </div>
            <div :class="['coin-item', { active: coinAmount === 2 }]" @click="updateCoinAmount(2)">
                <img class="image" :src="coin2" alt="Coin 2">
                <p class="label">2硬币</p>
            </div>
        </div>
        <template #footer>
            <div class="dialog-footer">
                <el-button class="confirm-button" type="primary" size="large" plain
                    @click="handleAction(UserVideoAction.coin, coinAmount)" :disabled="coinAmount === 0">
                    投币
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<style lang="scss" scoped>
.dialog {

    .title {
        margin: 20px 0;

        font-size: 20px;
        font-weight: 400;
        text-align: center;

        .number {
            font-size: 32px;
            color: $color-bilibili-blue;
        }
    }

    .content {
        display: flex;
        flex-direction: row;
        column-gap: 20px;
        justify-content: space-around;

        .coin-item {
            display: flex;
            flex-direction: column;
            align-items: center;

            border: 2px solid $color-neutral-2;
            border-radius: 8px;

            &.active,
            &:hover {
                border: 2px solid $color-bilibili-blue;
                border-radius: 8px;
            }

            .image {
                height: 240px;
            }

            .label {
                margin-top: 10px;
                font-size: 16px;
                color: $color-text-secondary;
            }
        }

    }

    .dialog-footer {
        display: flex;
        justify-content: center;
    }
}
</style>
