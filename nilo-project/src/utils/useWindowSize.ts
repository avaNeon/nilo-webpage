import { onMounted, onUnmounted, ref } from "vue";

const width = ref(window.innerWidth)
const height = ref(window.innerHeight)

// 计数器，记录使用的组件数
let listenerCount = 0

function update() {
    width.value = window.innerWidth
    height.value = window.innerHeight
}

// 响应式提供窗口尺寸，组件销毁时自动移除事件监听器
export function useWindowSize() {
    onMounted(() => {
        if (listenerCount === 0) {
            window.addEventListener('resize', update)
        }
        listenerCount++ // 只要有组件用，+1
    })
    onUnmounted(() => {
        listenerCount--
        // 如果没人用，销毁
        if (listenerCount === 0) {
            window.removeEventListener('resize', update)
        }
    })

    return { width, height }
}