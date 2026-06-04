<script setup lang="ts">
import { ref } from 'vue';
import useCategoryStore from '@/shared/store/CategoryStore';
import { BODY_PADDING } from '@/shared/config/Config';
import { useTimer } from '../model/useTimer';
import { useRipple } from '../model/useRipple';

const categoryStore = useCategoryStore();
const { isUnfoldedHovered, isFoldedHovered, itemHover, subItemsDalayAndTransition, waitAndChange, waitAndLeave } = useTimer();
const rippleLayerRef = ref<HTMLElement | null>(null)
const { onItemMousedown } = useRipple(rippleLayerRef)

const props = withDefaults(defineProps<{
    folded?: boolean
    maxWidth: number
    minWidth: number
}>(), {
    folded: false,
})


</script>

<template>
    <div class="category-bar unfolded" v-if="!folded" @mouseenter="isUnfoldedHovered = true"
        @mouseleave="isUnfoldedHovered = false" :style="{
            'padding-left': BODY_PADDING,
            'padding-right': BODY_PADDING,
        }">
        <RouterLink to="/popular" class="popular">
            <div class="iconfont icon-hot"></div>
            <div class="popular-info">热门</div>
        </RouterLink>
        <div class="category-items" :class="{ expanded: isUnfoldedHovered, extra: itemHover }">
            <div :class="['category-item-container', categoryStore.currentPCategory?.categoryNumber === categoryItem.categoryNumber ? 'active' : '']"
                v-for="categoryItem in categoryStore.categoryList" :key="categoryItem.categoryNumber"
                @mouseenter="waitAndChange($event)" @mouseleave="waitAndLeave($event)">
                <RouterLink draggable="false" class="category-item" :to="`/c/${categoryItem.categoryNumber}`"
                    @mousedown="(e) => onItemMousedown(e, categoryItem.color)" :style="{
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
        <div class="others">
            <div class="online-user-count">
                <img class="user-count-img" src="@/assets/bilibili_tv.jpg" alt="bilibili"><!-- 以后可以在这里设计个图片 -->
                <!-- <span class="count-text">在线人数：</span> -->
                <!-- <span class="count-number">0</span> --><!-- 这个数字后端还没做，暂时写死为0 -->
            </div>
            <RouterLink class="read" to="/read">
                <img class="read-img" src="@/assets/document.svg" alt="document">
                <span class="read-text">专栏</span>
            </RouterLink>
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
        <div class="category-items" :class="{ expanded: isFoldedHovered }">
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
        <img class="down-arrow" :class="{ rotated: isFoldedHovered }" src="@/assets/down_arrow.svg" alt="展开箭头" />
    </div>

    <Teleport to="body">
        <div class="category-page-ripple-layer" ref="rippleLayerRef"></div>
    </Teleport>
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
            flex: 1;
            gap: 10px;
            margin: 15px 20px 0px;

            overflow: hidden;
            max-height: 80px;

            transition: max-height 0.2s 0.2s ease; // 收起时有0.2s的过渡时间和0.2s的延迟，延迟时间必须大于subItemsDalayAndTransition，避免和子分类的过渡冲突

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

                &:hover {
                    overflow: visible;
                    z-index: 300;

                    .sub-category-items {
                        opacity: 1;
                        visibility: visible;
                        transform: translateX(-50%) translateY(0);
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
                    transition: background-color 0.3s;

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
                    z-index: 200;
                    top: calc(100% + 4px); // 紧挨着父级
                    left: 50%;

                    background-color: white;
                    border: 1px solid $color-border;
                    border-radius: 7px;
                    padding: 10px 5px;
                    width: 100px;

                    opacity: 0;
                    visibility: hidden;
                    transform: translateX(-50%) translateY(10px);

                    display: flex; // 改回 flex
                    flex-direction: column;
                    justify-content: space-around;
                    row-gap: 10px;
                    // 子菜单变化时间和延迟保持0.2s
                    transition-property: opacity, visibility, transform;
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

        .others {
            width: 180px;
            padding: 5px;

            min-width: 150px;

            .online-user-count {
                color: $color-text-primary;
                display: flex;
                align-items: center;

                .user-count-img {
                    width: 50px;
                }

                .count-text {
                    font-size: 20px;
                    font-weight: 500;
                }

                .count-number {
                    font-size: 30px;
                    font-weight: 500;
                }
            }

            .read {
                padding: 5px 0;
                width: 70px;
                height: 40px;
                line-height: 30px;
                text-align: center;
                color: $color-text-secondary;
                border-radius: 7px;
                text-decoration: none;
                display: flex;
                align-items: center;

                &:hover {
                    .read-text {
                        color: $color-bilibili-blue;
                    }
                }

                .read-img {
                    width: 20px;
                }

                .read-text {
                    font-size: 16px;
                }
            }
        }
    }

    &.folded {
        position: absolute;
        top: $header-bar-height;
        margin: 0 auto;
        width: 100%;
        z-index: 100;
        color: $color-text-muted;
        border-bottom: $color-border solid 1px;
        padding: 10px 100px;
        background: white;
        justify-content: space-between;
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

            &.expanded {
                max-height: 150px;
                transition: max-height 0.2s ease-in; // 展开和收起可以共用或单独设置
            }

            .category-item {
                display: inline-block;
                text-decoration: none;
                width: 9%; // 一行10个
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

<style lang="scss">
.category-page-ripple-layer {
    position: fixed;
    left: 0;
    width: 100%;
    overflow: hidden;
    pointer-events: none;
    z-index: 201;
    /* top 和 height 由 useRipple 在每次 mousedown 时动态设置 */
}

.category-ripple-press {
    position: absolute;
    border-radius: 50%;
    /* background-color 由 useRipple 内联设置，支持自定义颜色 */
    pointer-events: none;
    transform: scale(0);
    animation: category-ripple-press 0.8s ease-out forwards;
}

@keyframes category-ripple-press {
    0% {
        transform: scale(0);
        opacity: 0.2;
    }

    60% {
        transform: scale(1);
        opacity: 0.12;
    }

    100% {
        transform: scale(1);
        opacity: 0;
    }
}
</style>
