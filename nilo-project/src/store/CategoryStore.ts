import { defineStore } from "pinia";
import type { CategoryInfo } from "../models/CategoryInfo";

const useCategoryStore = defineStore('category', {
    state() {
        return {
            categoryMap: {} as Record<string, CategoryInfo>,
            categoryList: [] as CategoryInfo[],
            currentPCategory: null as CategoryInfo | null,
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
            }
            else {
                this.currentPCategory = {} as CategoryInfo
            }
        },
        getParentCategory(subCategory: CategoryInfo) {
            return this.categoryList.find(parent =>
                parent.children?.some(child => child.categoryNumber === subCategory.categoryNumber)
            )
        }
    }
})

export default useCategoryStore