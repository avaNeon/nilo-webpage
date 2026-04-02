<script setup lang="ts">
import Avatar from '@/entities/ui/Avatar.vue';
import { useCategory } from '../model/useCategory';
const props = withDefaults(defineProps<{ theme?: string }>(), {
    theme: "light"
}) // theme属性，可以是light或dark，默认为light

const { loginStateStore, categoryStore, getIcon } = useCategory();

</script>

<template>
    <div :class="['header-bar', 'header-bar-' + props.theme]">
        <div class="menu">
            <el-popover class="popover" placement="bottom-start" popper-class="category-popper">
                <template #reference>
                    <RouterLink to="/" class="iconfont icon-logo">首页</RouterLink>
                </template>
                <div class="popover-content">
                    <nav class="category-item" v-for="item in categoryStore.categoryList" :key="item.categoryNumber">
                        <RouterLink class="router-link" style="color: #18191c; text-decoration: none;"
                            :to="`/c/${item.categoryNumber}`">
                            <img :src="getIcon(item.icon)" style="width: 20px;margin-right: 10px;" />
                            <span>
                                {{ item.categoryName }}
                            </span>
                        </RouterLink>
                    </nav>
                </div>
            </el-popover>
            <nav></nav>
        </div>
        <div class="search">
            <div class="search-bar">
                <div class="search-bar-content">
                    <input />
                    <div class="iconfont icon-search"></div>
                </div>
                <div class="search-bar-panel">
                    <div class="history"></div>
                    <div class="trending"></div>
                </div>
            </div>
        </div>
        <div class="user">
            <div class="user-avatar">
                <Avatar
                    :src="loginStateStore.loginState && loginStateStore.userInfo && loginStateStore.userInfo.avatar ? loginStateStore.userInfo.avatar : ''"
                    :user-id="loginStateStore.userInfo ? loginStateStore.userInfo.userId : null" :lazy="false"
                    :width="48">
                </Avatar>
            </div>
            <nav>
                <div class="iconfont icon-message"></div>
                <div class="description">消息</div>
            </nav>
            <nav>
                <div class="iconfont icon-collection"></div>
                <div class="description">收藏</div>
            </nav>
            <nav>
                <div class="iconfont icon-history"></div>
                <div class="description">历史</div>
            </nav>
            <nav>
                <div class="iconfont icon-light"></div>
                <div class="description">创作中心</div>
            </nav>

            <el-button class="post" type="primary" size="large">
                <span class="iconfont icon-upload"></span>
                <span>投稿</span>
            </el-button>
        </div>
    </div>
</template>

<style lang="scss">
// popover的内部类名
.category-popper {
    width: max-content !important;

    // 自定义渐变时长
    &.el-popper {
        transition: opacity 0.2s ease, transform 0.2s ease !important;
    }
}

// 控制 Element Plus Popover 的渐变动画时长
.el-fade-in-linear-enter-active,
.el-fade-in-linear-leave-active {
    transition: opacity 0.2s linear !important;
}

.popover-content {
    --category-rows: 5;
    --category-item-height: 40px;
    --category-row-gap: 10px;

    display: grid;
    grid-auto-flow: column;
    grid-template-rows: repeat(var(--category-rows), auto);
    row-gap: var(--category-row-gap);
    column-gap: 30px;
    max-height: 400px;


    .category-item {
        position: relative;
        padding: 5px 10px;
        height: var(--category-item-height);
        font-size: 15px;

        line-height: 30px;
        text-align: center;

        border-radius: 10px;

        cursor: pointer;

        &:hover {
            background-color: $color-neutral-1;
        }

        .router-link {
            display: flex;
            align-items: center;
        }
    }

    /* 第2列起，每列首个元素画一条整列分隔线 */
    .category-item:nth-child(5n + 1):not(:first-child)::before {
        content: '';
        position: absolute;
        left: -15px;
        top: 0;
        width: 1px;
        height: calc(var(--category-rows) * var(--category-item-height) + (var(--category-rows) - 1) * var(--category-row-gap));
        background-color: $color-border;
        pointer-events: none;
    }
}
</style>

<style lang="scss" scoped>
.header-bar {
    height: $header-bar-height;
    padding: 0 20px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);

    .menu {
        display: flex;
        align-items: center;

        .icon-logo {
            text-decoration: none;
            font-size: 16px;
            line-height: 16px;

            &::before {
                margin-right: 6px;
            }
        }
    }

    .search {
        display: flex;
        align-items: center;
        flex: 1;
        position: relative;

        .search-bar {
            width: 90%;
            margin: 0 auto;
        }

        .search-bar-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: $color-neutral-1;
            opacity: 0.8;
            border-radius: 8px;
            padding: 0 8px;
            height: 36px;
            position: relative;

            &:hover {
                opacity: 1;
            }

            input {
                flex: 1;
                border: none;
                background: none;
                outline: none;
                height: 32px;
                background-color: $color-neutral-1;
                opacity: inherit;

                &:focus {
                    border-radius: 5px;
                    background-color: $color-neutral-2;
                    z-index: 1000;
                }
            }

            .icon-search {
                color: #18191c;
                font-size: 18px;
                line-height: 18px;
                cursor: pointer;
                padding-left: 15px;
            }
        }
    }

    .user {
        display: flex;
        justify-content: flex-end;
        align-items: center;

        .user-avatar {
            margin: 0 20px;
        }

        >nav {
            text-align: center;
            cursor: pointer;
            width: 56px;

            .iconfont {
                text-align: center;
                font-size: 22px;
            }

            .description {
                text-align: center;
                font-size: 13px;
                font-weight: normal;
            }
        }

        .post {
            margin: 0 20px;
            border-radius: 8px;
            background-color: $color-brand-pink;
            border-color: $color-brand-pink;

            .iconfont {
                margin-right: 7px;
            }

        }
    }
}

.header-bar-light {
    color: white;

    .icon-logo {
        color: white;
    }

    .user {
        >nav {
            color: white;
        }
    }
}

.header-bar-dark {
    color: black;
    background-color: white;
    box-shadow: 0 2px 4px $color-header-shadow;
    border-bottom: $color-border solid 1px;

    .icon-logo {
        color: black;
    }

    .user {
        >nav {
            color: black;
        }
    }
}
</style>
