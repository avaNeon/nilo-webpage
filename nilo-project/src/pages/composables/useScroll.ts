import { ref } from "vue"

/**
 * 滚动条相关业务逻辑
 */
export function useScroll() {
    /**
     * 判断是否固定顶部变量
     */
    const headerFixed = ref(false)
    /**
     * category 是否折叠
     */
    const categoryFolded = ref(false)
    /**
     * 锁定是否不出现顶栏分类，为true时代表不会出现顶栏分类
     */
    const hideFixedFolded = ref(false)
    /**
     * 不透明度
     */
    const headerOpacity = ref(0)

    /**
     * 滚动监听函数
     */
    function scrollChecker() {
        let scrollY = window.scrollY
        if (scrollY <= 30) {
            headerFixed.value = false
            headerOpacity.value = 0
        }
        else {
            headerFixed.value = true
            // 计算不透明度：从 30px 开始出现，到 100px 达到 100%
            // (scrollY - 30) / (100 - 30)
            let opacity = (scrollY - 30) / 70
            headerOpacity.value = Math.min(1, Math.max(0, opacity))
        }

        // 当滚动高度超过 banner 高度时（这里是 200px），让 category 折叠
        // 也可以根据实际高度微调这个值
        categoryFolded.value = scrollY > 250
    }

    return {
        headerFixed,
        categoryFolded,
        hideFixedFolded,
        headerOpacity,
        scrollChecker
    }
}