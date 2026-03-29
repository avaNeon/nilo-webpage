import useCategoryStore from '@/shared/store/CategoryStore'
import { Api } from '@/shared/config/Api'
import request from '@/shared/lib/request'
import type { CategoryInfo } from '@/entities/model/CategoryInfo'
import { ServiceType } from '@/entities/model/ServiceType'

/**
 * 初始化分类信息
 * @returns 获取全部分类函数
 */
export function useInitCategories() {
    const categoryStore = useCategoryStore()

    /**
     * 将全部分类信息加载到 CategoryStore 中，包含 categoryList 和 categoryMap
     */
    async function loadAllCategories() {
        const result = await request({ method: 'get', url: Api.loadAllCategories, serviceType: ServiceType.admin })
        if (!result?.data) {
            return
        }
        const categoryList: CategoryInfo[] = result.data
        const categoryMap: Record<string, CategoryInfo> = {}
        result.data.forEach((item: CategoryInfo) => {
            categoryMap[item.categoryNumber] = item
            item.children?.forEach((child: CategoryInfo) => {
                categoryMap[child.categoryNumber] = child
            })
        })
        categoryStore.setCategoryList(categoryList)
        categoryStore.setCategoryMap(categoryMap)
    }

    return { loadAllCategories }
}
