<script lang="ts" setup>
import { BODY_PADDING } from '@/shared/config/Config';
import useCategoryStore from '@/shared/store/CategoryStore';
import { inject, ref } from 'vue';
import { useRoute } from 'vue-router';


const categoryStore = useCategoryStore()
const route = useRoute()

const subCategoryFolded = inject('subCategoryFolded', ref(false))

</script>

<template>
    <div :class="['category-banner',]">
        <div id="category-list" :class="['category-list', subCategoryFolded ? 'category-folded' : '']" :style="{
            'paddingLeft': subCategoryFolded ? BODY_PADDING : '0',
            'paddingRight': subCategoryFolded ? BODY_PADDING : '0',
        }">
            <div class="category-name">
                <span class="title">{{ categoryStore.currentPCategory?.categoryName ?? '加载中...' }}</span>
            </div>
            <div class="sub-categories">
                <div :class="['sub-category-name', !route.params.subCategoryNumber ? 'active' : '']">
                    <RouterLink class="sub-category" :to="`/c/${categoryStore.currentPCategory?.categoryNumber}`">
                        全部
                    </RouterLink>
                </div>
                <div v-for="subCategory in categoryStore.categoryMap[categoryStore.currentPCategory?.categoryNumber as string]?.children"
                    :class="['sub-category-name', route.params.subCategoryNumber === subCategory.categoryNumber ? 'active' : '']">
                    <RouterLink class="sub-category"
                        :to="`/c/${categoryStore.currentPCategory?.categoryNumber}/${subCategory.categoryNumber}`">
                        {{ subCategory.categoryName }}
                    </RouterLink>

                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
// .placeholder-blank {
//     width: 100%;
//     height: 60px;
// }

.category-banner {
    height: 60px;

    background-color: white;

    .category-list {
        height: 60px;

        display: flex;
        column-gap: 50px;
        align-items: baseline;

        .category-name {

            .title {
                font-size: 28px;
                font-weight: 500;
            }
        }

        .sub-categories {
            display: flex;
            column-gap: 20px;
            align-items: baseline;

            .sub-category-name {
                .sub-category {
                    font-size: 18px;
                    color: black;
                    text-decoration: none;

                    line-height: 60px;
                }

                &.active {
                    .sub-category {
                        color: $color-bilibili-blue;
                        font-weight: 500;
                    }
                }
            }
        }

        &.category-folded {
            position: fixed;
            top: $header-bar-height;
            left: 0;
            right: 0;
            background-color: white;

            border-bottom: 1px solid $color-border;

            z-index: 300;
        }
    }


}
</style>