<script setup lang="ts">
import Avatar from '@/shared/entities/avatar/ui/Avatar.vue';
import { useCategory } from '../model/useCategory';
import { imgRequestUrl } from '@/shared/utils/ImgUtil';
import { useLoginStateStore } from '@/shared/store/LoginStateStore';
import { routerToNewPage } from '@/shared/utils/RouteUtil';
import SearchBar from '@/shared/features/searchBar/ui/SearchBar.vue';
import { MessageApi } from '@/shared/api/MessageApi';
import Dialog from '@/shared/ui/Dialog.vue';
import { Connection } from '@element-plus/icons-vue';
import { computed, ref, watch } from 'vue';

const CONTACT_EMAIL = 'unitneon@outlook.com';

const props = withDefaults(defineProps<{
    theme?: string,
    showSearch?: boolean,
}>(), {
    theme: "light",
    showSearch: true,
}) // theme属性，可以是light或dark，默认为light

const { categoryStore, getIcon } = useCategory();
const loginStateStore = useLoginStateStore();
const showContactDialog = ref(false);
const uncheckedMessageCount = ref(0);
const uncheckedMessageCountText = computed(() =>
    uncheckedMessageCount.value > 99 ? '99+' : String(uncheckedMessageCount.value),
)

function requireLoginThen(pathOrFactory: string | (() => string))
{
    if (!loginStateStore.loginState || !loginStateStore.userInfo?.userId)
    {
        loginStateStore.showPanel = true;
        return;
    }
    const path = typeof pathOrFactory === 'function' ? pathOrFactory() : pathOrFactory;
    routerToNewPage(path);
}

async function loadUncheckedMessageCount()
{
    const messageCount = await MessageApi.getUncheckedMessageCount();
    uncheckedMessageCount.value =
        (messageCount?.systemMessageCount ?? 0) +
        (messageCount?.likeMessageCount ?? 0) +
        (messageCount?.collectMessageCount ?? 0) +
        (messageCount?.commentMessageCount ?? 0);
}

// 等 loginState 就绪后再拉未读数，避免未登录/autoLogin 未完成时误请求
watch(
    () => loginStateStore.loginState,
    loggedIn =>
    {
        if (loggedIn)
        {
            loadUncheckedMessageCount();
        }
        else
        {
            uncheckedMessageCount.value = 0;
        }
    },
    { immediate: true },
)

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
            <button type="button" class="contact-btn" @click="showContactDialog = true">
                <el-icon><Connection /></el-icon>
                <span class="contact-text">联系</span>
            </button>
        </div>
        <div v-if="props.showSearch" class="search">
            <SearchBar />
        </div>
        <div v-else></div>
        <div class="user">
            <div class="user-avatar">
                <Avatar :src="loginStateStore.userInfo ? imgRequestUrl(loginStateStore.userInfo.avatar, true) : ''"
                    :user-id="loginStateStore.userInfo ? loginStateStore.userInfo.userId : null" :lazy="false"
                    :width="48">
                </Avatar>
            </div>
            <nav class="message-nav">
                <div class="iconfont icon-message" @click="requireLoginThen('/message/1')"></div>
                <div v-if="uncheckedMessageCount > 0" class="message-badge">
                    {{ uncheckedMessageCountText }}
                </div>
                <div class="description">消息</div>
            </nav>
            <nav @click="requireLoginThen(() => `/user/${loginStateStore.userInfo!.userId}/collection`)">
                <div class="iconfont icon-collection"></div>
                <div class="description">收藏</div>
            </nav>
            <nav @click="requireLoginThen(() => `/history/${loginStateStore.userInfo!.userId}`)">
                <div class="iconfont icon-history"></div>
                <div class="description">历史</div>
            </nav>
            <nav @click="requireLoginThen('/cc')">
                <div class="iconfont icon-light"></div>
                <div class="description">创作中心</div>
            </nav>

            <el-button class="post" type="primary" size="large" @click="requireLoginThen('/cc/upload')">
                <span class="iconfont icon-upload"></span>
                <span>投稿</span>
            </el-button>
        </div>
    </div>
    <Dialog :show="showContactDialog" title="联系方式" :width="420" :top="160" :show-cancel="false"
        :handle-close="() => { showContactDialog = false }">
        <p class="contact-email">邮箱：{{ CONTACT_EMAIL }}</p>
    </Dialog>
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

        .contact-btn {
            margin-left: 18px;
            border: none;
            background: transparent;
            color: inherit;
            font-size: 16px;
            line-height: 16px;
            cursor: pointer;

            &:hover {
                opacity: 0.85;
            }

            .contact-text {
                margin-left: 6px;
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
            position: relative;

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

        .message-nav {
            .message-badge {
                position: absolute;
                top: -6px;
                right: 8px;
                min-width: 18px;
                height: 18px;
                padding: 0 5px;
                box-sizing: border-box;
                border-radius: 9px;
                color: white;
                background-color: $color-warning-red;
                font-size: 12px;
                font-weight: 600;
                line-height: 18px;
                text-align: center;
                pointer-events: none;
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

    .icon-logo,
    .contact-btn {
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

    .icon-logo,
    .contact-btn {
        color: black;
    }

    .user {
        >nav {
            color: black;
        }
    }
}

.contact-email {
    margin: 0;
    font-size: 15px;
    line-height: 1.6;
    color: $color-text-primary;
    word-break: break-all;
}
</style>
