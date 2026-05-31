import { ref } from "vue";

export function useTimer() {
    const isUnfoldedHovered = ref(false);
    const isFoldedHovered = ref(false);
    const itemHover = ref(false)
    const subItemsDalayAndTransition: number = 0.1 // 子分类的延迟和过渡时间，单位秒
    let hoverTimer: number | null = null

    function waitAndChange(e: MouseEvent) {
        const el = e.currentTarget as HTMLElement | null
        if (!el) return

        // 每次进入先清理旧定时器，避免并发
        if (hoverTimer !== null) {
            clearTimeout(hoverTimer)
            hoverTimer = null
        }

        hoverTimer = window.setTimeout(() => {
            // 200ms 后再确认：鼠标是否还在这个元素上
            if (el.matches(':hover')) {
                itemHover.value = true
            }
            hoverTimer = null
        }, subItemsDalayAndTransition * 1000)
    }

    function waitAndLeave(e: MouseEvent) {
        const el = e.currentTarget as HTMLElement | null
        if (!el) return
        if (hoverTimer !== null) {
            clearTimeout(hoverTimer)
            hoverTimer = null
        }
        hoverTimer = window.setTimeout(() => {
            // 200ms 后再确认：鼠标是否还在这个元素上
            if (!el.matches(':hover')) {
                itemHover.value = false
            }
            hoverTimer = null
        }, subItemsDalayAndTransition * 1000)
    }

    return {
        isUnfoldedHovered,
        isFoldedHovered,
        itemHover,
        subItemsDalayAndTransition,
        waitAndChange,
        waitAndLeave
    }
}

