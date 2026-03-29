import useCategoryStore from "@/shared/store/CategoryStore"
import { watch } from "vue"
import { useRoute } from "vue-router"
/**
 * 分类相关业务逻辑
 */
export function useCategory() {
    const route = useRoute()
    const categoryStore = useCategoryStore()

    function startRouteWatching() {
        // 监听路由参数变化，或是分类信息加载完成后的变化，自动更新 Store 状态
        // 这样即使用户直接在地址栏输入 URL，或者点击后退/前进按钮，分类状态都能同步
        watch([() => route.params.categoryNumber, () => categoryStore.categoryMap], ([categoryNumber]) => {
            categoryStore.setCurrentPCategoryByNumber((categoryNumber || null) as string | null)
        }, { immediate: true })

        // 监听完整路径，如果是首页则清空分类
        watch(() => route.path, (newPath) => {
            if (newPath === '/facade' || newPath === '/') {
                categoryStore.setCurrentPCategoryByNumber(null)
            }
        })
    }

    return { startRouteWatching }
}

