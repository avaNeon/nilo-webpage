import { defineStore } from "pinia";

const useVideoStateStore = defineStore('videoState', {
    state() {
        return {
            displayMode: 'normal' as 'normal' | 'theater',
        }
    },
    actions: {
        setDisplayMode(mode: 'normal' | 'theater') {
            this.displayMode = mode
        }
    }
})

export default useVideoStateStore