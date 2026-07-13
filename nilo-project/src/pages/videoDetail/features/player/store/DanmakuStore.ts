import { defineStore } from 'pinia'
import type { Danmaku } from '@/shared/model/Danmaku'

export const useDanmakuStore = defineStore('danmaku', {
    state() {
        return {
            danmakuList: [] as Danmaku[],
            danmakuEnabled: true,
        }
    },
    actions: {
        setDanmakuList(list: Danmaku[]) {
            this.danmakuList = list
        },
        resetDanmakuList() {
            this.danmakuList = []
        },
        toggleDanmakuEnabled() {
            this.danmakuEnabled = !this.danmakuEnabled
        },
    }
})
