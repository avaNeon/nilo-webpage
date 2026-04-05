import { type Ref } from 'vue'

/**
 * ripple composable
 * @param rippleLayerRef  Teleport 到 body 的涟漪层 ref
 *
 * onItemMousedown 应绑定在 .category-item 上
 * @param event  MouseEvent
 * @param color  可选，任意合法 CSS 颜色字符串（如 '#a725fd'、'rgb(128,0,200)'）
 *               默认紫色 '#a725fd'
 */
export function useRipple(rippleLayerRef: Ref<HTMLElement | null>) {
    function onItemMousedown(event: MouseEvent, color = '#a725fd') {
        const item = event.currentTarget as HTMLElement
        const bar = item.closest('.category-bar') as HTMLElement | null
        if (!bar) return
        const layer = rippleLayerRef.value
        if (!layer) return

        const barRect = bar.getBoundingClientRect()
        const layerTop = barRect.top

        // 涟漪层从 Category 顶部覆盖到屏幕底部
        layer.style.top = `${layerTop}px`
        layer.style.height = `${window.innerHeight - layerTop}px`

        const cx = event.clientX
        const cy = event.clientY
        const W = window.innerWidth

        // 水平：点击到最远边缘；垂直：点击到层内最远边缘
        const dx = Math.max(cx, W - cx)
        const dy = Math.max(cy - layerTop, window.innerHeight - cy)
        const radius = Math.sqrt(dx * dx + dy * dy)
        const diameter = radius * 2

        // 涟漪坐标相对于 layer（layer.top = layerTop）
        const rippleLeft = cx - radius
        const rippleTop = cy - layerTop - radius

        const ripple = document.createElement('span')
        ripple.classList.add('category-ripple-press')
        ripple.style.width = ripple.style.height = `${diameter}px`
        ripple.style.left = `${rippleLeft}px`
        ripple.style.top = `${rippleTop}px`
        ripple.style.backgroundColor = color
        layer.appendChild(ripple)
        ripple.addEventListener('animationend', () => ripple.remove(), { once: true })
    }

    return { onItemMousedown }
}

