import useCategoryStore from "@/shared/store/CategoryStore"
import { ServicePrefixMap, Api } from "@/shared/config/Api"
import { computed } from "vue"

/**
 * 背景头图相关业务逻辑
 */
export function useBackgroundImg() {
    const categoryStore = useCategoryStore()

    /**
     * 背景头图的资源url
     */
    const bgImgUrl = computed((): string | null => {
        const path = categoryStore.currentPCategory?.background
        if (!path) return null
        // 直接把后端接口地址和图片路径拼接起来
        // 浏览器会自动发出 GET 请求获取图片流
        return `${import.meta.env.VITE_APP_BASE_URL}${ServicePrefixMap.web}${Api.sourcePath}${path}`
    })

    return { bgImgUrl }
}

