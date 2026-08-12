<script setup lang="ts">
import useCategoryStore from '@/shared/store/CategoryStore';
import { BODY_PADDING } from '@/shared/config/Config';
import { useTimer } from '../model/useTimer';
import { computed } from 'vue';

/** 每排固定展示的分类数量（对应 CSS 中 unfolded 10% / folded 9% 的宽度设计） */
const ITEMS_PER_ROW = 10;
/** 折叠态最多展示的排数，超过才需要"展开更多" */
const MAX_COLLAPSED_ROWS = 2;

const categoryStore = useCategoryStore();
const { isUnfoldedHovered, isFoldedHovered, itemHover, subItemsDalayAndTransition, waitAndChange, waitAndLeave } = useTimer();

const props = withDefaults(defineProps<{
    folded?: boolean
    maxWidth: number
    minWidth: number
}>(), {
    folded: false,
})

/**
 * 分类是否超过折叠排数，只有超过时才允许悬停展开 / 显示下拉箭头。
 * 用固定的"每排数量"直接算，而不是量 DOM 高度：
 * 量 DOM 高度需要用 ResizeObserver 监听同一个会被这个值反过来改变样式（max-height/overflow）的元素，
 * 一旦这个值变化触发样式变化、样式变化又改变了尺寸，就会形成量出来 -> 改样式 -> 尺寸变 -> 又触发量 的死循环，
 * 表现为分类栏每隔一两百毫秒自己抖一下（不需要鼠标悬浮也会抖）。
 */
const needsExpand = computed(() =>
    categoryStore.categoryList.length > ITEMS_PER_ROW * MAX_COLLAPSED_ROWS,
);

const isExpanded = computed(() =>
    needsExpand.value && (props.folded ? isFoldedHovered.value : isUnfoldedHovered.value),
);
</script>

<template>
    <div class="category-bar unfolded" v-if="!folded" @mouseenter="isUnfoldedHovered = true"
        @mouseleave="isUnfoldedHovered = false" :style="{
            'padding-left': BODY_PADDING,
            'padding-right': BODY_PADDING,
        }">
        <RouterLink to="/popular" class="popular" target="_blank">
            <div class="iconfont icon-hot"></div>
            <div class="popular-info">热门</div>
        </RouterLink>
        <div
            class="category-items"
            :class="{
                expanded: isExpanded,
                // 仅在被 max-height 裁切时才切 overflow，否则会在第二排裁切边产生抖动
                extra: itemHover && needsExpand,
                'no-clamp': !needsExpand,
            }"
        >
            <div :class="['category-item-container', categoryStore.currentPCategory?.categoryNumber === categoryItem.categoryNumber ? 'active' : '']"
                v-for="categoryItem in categoryStore.categoryList" :key="categoryItem.categoryNumber"
                @mouseenter="waitAndChange($event)" @mouseleave="waitAndLeave($event)">
                <RouterLink draggable="false" class="category-item" :to="`/c/${categoryItem.categoryNumber}`"
                    :style="{
                        '--category-color': categoryItem.color,
                        '--category-hover-bg': categoryItem.color + '50',
                    }">
                    <span class="category-name">
                        {{ categoryItem.categoryName }}
                    </span>
                </RouterLink>
                <!-- 子分类窗口只有存在子分类的时候才显示 -->
                <div class="sub-category-items" v-if="categoryItem.children && categoryItem.children.length > 0" :style="{
                    transitionDuration: subItemsDalayAndTransition + 's',
                    transitionDelay: subItemsDalayAndTransition + 's'
                }">
                    <div class="sub-category-item" v-for="subCategoryItem in categoryItem.children"
                        :key="subCategoryItem.categoryNumber">
                        <RouterLink class="sub-category-nav"
                            :to="`/c/${categoryItem.categoryNumber}/${subCategoryItem.categoryNumber}`">
                            {{ subCategoryItem.categoryName }}
                        </RouterLink>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="category-bar folded" v-else @mouseenter="isFoldedHovered = true" @mouseleave="isFoldedHovered = false"
        :style="{
            'padding-left': BODY_PADDING,
            'padding-right': BODY_PADDING,
            'max-width': maxWidth + 'px',
            'min-width': minWidth + 'px',
        }">
        <RouterLink to="/popular" class="popular">
            <div class="iconfont icon-hot"></div>
            <div class="popular-info">热门</div>
        </RouterLink>
        <div class="category-items" :class="{ expanded: isExpanded, 'no-clamp': !needsExpand }">
            <RouterLink class="category-item" v-for="categoryItem in categoryStore.categoryList"
                :key="categoryItem.categoryNumber" :to="`/c/${categoryItem.categoryNumber}`" :style="{
                    '--category-color': categoryItem.color,
                    '--category-hover-bg': categoryItem.color + '50',
                }">
                <span class="category-name">
                    {{ categoryItem.categoryName }}
                </span>
            </RouterLink>
        </div>
        <img v-if="needsExpand" class="down-arrow" :class="{ rotated: isFoldedHovered }" src="@/assets/down_arrow.svg"
            alt="展开箭头" />
    </div>

</template>

<style lang="scss" scoped>
.category-bar {

    display: flex;
    padding-top: 5px;
    padding-bottom: 5px;
    background-color: white;
    justify-content: space-around;
    position: relative;

    &.unfolded {
        border-bottom: $color-border solid 1px;
        // 不设置这个的话，容器默认 align-items: stretch 会把矮的 category-items 拉到跟高个的 .popular 一样高，
        // category-items 内部（flex-wrap）又会把这份多余高度摊到每一排的分类块上，
        // 分类块的实际渲染高度就会比看起来该有的 30px 高出几像素，肉眼看是"晃了一下"
        align-items: flex-start;

        .popular {
            text-decoration: none;
            display: flex;
            flex-direction: column;
            align-items: center;
            margin: 10px;

            .icon-hot {
                background-color: $color-hot;
                color: white;
                border-radius: 50%;
                height: 50px;
                width: 50px;
                font-size: 30px;
                line-height: 50px;
                text-align: center;
            }

            .popular-info {
                margin: 5px;
                font-size: 14px;
                color: black;
            }
        }

        .category-items {

            display: flex;
            flex-wrap: wrap;
            align-items: flex-start;
            align-content: flex-start;
            flex: 1;
            gap: 10px;
            margin: 15px 20px 0px;

            overflow: hidden;
            max-height: 80px;

            transition: max-height 0.2s 0.2s ease; // 收起时有0.2s的过渡时间和0.2s的延迟，延迟时间必须大于subItemsDalayAndTransition，避免和子分类的过渡冲突

            // 未超过两排：不裁切、不动画，避免悬停切换 overflow 导致第二排抖动
            &.no-clamp {
                max-height: none;
                overflow: visible;
                transition: none;
            }

            &.expanded {
                max-height: 200px;
                transition: max-height 0.1s 0s ease; // 出现时没有延迟，过渡时间必须小于subItemsDalayAndTransition，否则会有冲突
            }

            &.extra {
                overflow: visible;
            }

            .category-item-container {
                width: calc(10% - 10px);
                position: relative;
                // 父级裁切时默认藏住绝对定位子菜单，避免撑高；no-clamp 时保持 visible，禁止悬停切换 overflow
                overflow: hidden;

                &:hover {
                    overflow: visible;
                    z-index: 300;

                    .sub-category-items {
                        opacity: 1;
                        visibility: visible;
                        pointer-events: auto;
                    }
                }

                &.active {

                    .category-item {
                        background-color: var(--category-hover-bg);
                        color: var(--category-color);
                        font-weight: 500;
                    }
                }

                .category-item {
                    display: block;
                    text-decoration: none;
                    width: 100%;
                    height: 30px;
                    line-height: 30px;
                    text-align: center;
                    color: $color-text-secondary;
                    background-color: $color-surface;
                    border-radius: 7px;
                    transition: background-color 0.3s, color 0.3s;

                    &:hover {
                        background-color: var(--category-hover-bg);
                        color: var(--category-color);
                    }

                    .category-name {
                        font-size: 14px;
                        white-space: nowrap;
                    }
                }

                .sub-category-items {
                    position: absolute;
                    z-index: 300;
                    top: calc(100% + 4px); // 紧挨着父级
                    left: 50%;
                    transform: translateX(-50%);

                    background-color: white;
                    border: 1px solid $color-border;
                    border-radius: 7px;
                    padding: 10px 5px;
                    width: 100px;

                    opacity: 0;
                    visibility: hidden;
                    pointer-events: none;

                    display: flex;
                    flex-direction: column;
                    justify-content: space-around;
                    row-gap: 10px;
                    // 只用透明度，避免 translateY 造成第二排视觉抖动
                    transition-property: opacity, visibility;
                    transition-timing-function: ease;

                    .sub-category-item {
                        width: 100%;
                        text-align: center;

                        .sub-category-nav {
                            display: inline-block;
                            width: 100%;
                            border-radius: 5px;

                            padding: 5px 0;
                            text-decoration: none;
                            color: $color-text-primary;
                            font-size: 14px;

                            &:hover {
                                color: $color-bilibili-blue;
                                background-color: $color-surface-hover;
                            }
                        }
                    }
                }
            }
        }

        .category-items.no-clamp {
            .category-item-container {
                overflow: visible;

                &:hover {
                    overflow: visible; // 与默认一致，避免 hidden→visible 切换引发抖动
                }
            }
        }
    }

    &.folded {
        position: absolute;
        top: $header-bar-height;
        margin: 0 auto;
        width: 100%;
        z-index: 300;
        color: $color-text-muted;
        border-bottom: $color-border solid 1px;
        padding: 10px 100px;
        background: white;
        justify-content: space-between;
        align-items: flex-start;
        transition: all 0.3s;

        .popular {
            display: flex;
            align-items: center;
            text-decoration: none;
            width: 70px;
            height: 30px;
            margin-right: 10px;

            &:hover {
                .icon-hot {
                    color: $color-bilibili-blue;
                }

                .popular-info {
                    color: $color-bilibili-blue;
                }
            }

            .icon-hot {
                color: $color-text-muted;
                border-radius: 50%;
                height: 30px;
                width: 30px;
                line-height: 30px;
                font-size: 20px;
                text-align: center;
            }

            .popular-info {
                color: $color-text-muted;
                font-size: 16px;
            }
        }

        .category-items {
            flex-wrap: wrap;
            column-gap: 15px;
            row-gap: 10px;
            overflow: hidden;
            display: flex;

            justify-content: start;
            align-items: center;
            flex: 1;

            min-width: 800px;
            padding: 0 10px;
            margin: 0 10px;
            border-left: $color-border solid 1px;
            max-height: 30px; // 初始最大高度
            transition: max-height 0.2s ease-out;

            &.no-clamp {
                max-height: none;
                overflow: visible;
                transition: none;
            }

            &.expanded {
                max-height: 150px;
                transition: max-height 0.2s ease-in; // 展开和收起可以共用或单独设置
            }

            .category-item {
                display: inline-block;
                text-decoration: none;
                width: 8.5%; // 一行10个
                height: 30px;
                line-height: 30px;
                text-align: center;
                color: $color-text-secondary;
                background-color: $color-surface;
                border-radius: 7px;

                &:hover {
                    background-color: var(--category-hover-bg);
                    color: var(--category-color);
                }

                .category-name {
                    font-size: 14px;
                    white-space: nowrap;
                }
            }
        }

        .down-arrow {
            width: 26px;
            height: 26px;
            padding: 6px;
            margin: 0 auto;
            transition: transform 0.3s;

            &.rotated {
                transform: rotate(180deg);
            }
        }

    }

}
</style>
