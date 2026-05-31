import { defineStore } from 'pinia'

export const useVideoActionUiStore = defineStore('videoActionUi', {
    state() {
        return {
            coinVisible: false,
            /**
             * 投币动画触发器，每次自增 1。
             * VideoActionItem 监听此值变化来播放投币动画。
             */
            coinAnimationTrigger: 0,
        }
    },
    actions: {
        openCoinDialog() {
            this.coinVisible = true
        },
        closeCoinDialog() {
            this.coinVisible = false
        },
        /**
         * 投币成功后调用，触发 VideoActionItem 中的硬币旋转动画。
         */
        triggerCoinAnimation() {
            this.coinAnimationTrigger++
        },
    },
})
