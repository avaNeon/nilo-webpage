import { defineStore } from 'pinia'

export const useVideoActionStateStore = defineStore('videoActionState', {
    state() {
        return {
            liked: false,
            coin: 0 as number,
            collected: false,
        }
    },
    actions: {
        reset() {
            this.liked = false
            this.coin = 0
            this.collected = false
        },
    },
})
