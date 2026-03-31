import { defineStore } from "pinia";
import type { CategoryInfo } from "@/shared/model/CategoryInfo";

const useCategoryStore = defineStore('category', {
    state() {
        return {
            /**
             * 分类映射表，键为 categoryNumber，值为 CategoryInfo 对象
             */
            categoryMap: {} as Record<string, CategoryInfo>,
            /**
             * 分类列表，包含所有一级分类及其子分类
             */
            categoryList: [] as CategoryInfo[],
            /**
             * 当前选中的一级分类信息，默认为 null
             */
            currentPCategory: null as CategoryInfo | null,
            /** 当前分类编号 */
            currentCategoryNumber: null as string | null,
        }
    },
    actions: {
        setCategoryMap(data: Record<string, CategoryInfo>) {
            this.categoryMap = data
        },
        setCategoryList(data: CategoryInfo[]) {
            this.categoryList = data
        },
        setCurrentPCategoryByNumber(categoryNumber: string | null) {
            if (categoryNumber) {
                const category = this.categoryMap[categoryNumber]
                if (category) {
                    // 先尝试按二级分类找父级，找不到时回退到当前分类本身
                    // 兼容「一级分类没有 children」的情况
                    const parent = this.categoryList.find(p =>
                        p.children?.some(c => c.categoryNumber === categoryNumber)
                    )
                    this.currentPCategory = parent || category
                }
                else {
                    this.currentPCategory = null
                }
            }
            else {
                this.currentPCategory = null
            }
        },
        setCurrentPCategory(data: string) {
            if (data) {
                this.currentPCategory = this.categoryMap[data] || {} as CategoryInfo
                this.currentCategoryNumber = data
            }
            else {
                this.currentPCategory = {} as CategoryInfo
            }
        },
        getParentCategory(subCategory: CategoryInfo) {
            return this.categoryList.find(parent =>
                parent.children?.some(child => child.categoryNumber === subCategory.categoryNumber)
            )
        },
        setCategoryNumber(categoryNumber: string | null) {
            this.currentCategoryNumber = categoryNumber
        }
    }
})

export default useCategoryStore
