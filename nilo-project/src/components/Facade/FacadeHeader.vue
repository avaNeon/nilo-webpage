<script setup lang="ts">
import { useLoginStateStore } from '../../store/LoginStateStore';
import Avator from '../public/Avator.vue';
const props = withDefaults(defineProps<{ theme?: string }>(), {
    theme: "light"
}) // theme属性，可以是light或dark，默认为light
const loginStateStore = useLoginStateStore();
</script>

<template>
    <div :class="['header-bar', 'header-bar-' + props.theme]">
        <div class="menu">
            <RouterLink to="/facade" class="iconfont icon-logo">首页</RouterLink>
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
            <div class="user-avator">
                <Avator
                    :src="loginStateStore.loginState && loginStateStore.userInfo && loginStateStore.userInfo.avatar ? loginStateStore.userInfo.avatar : ''"
                    :user-id="loginStateStore.userInfo ? loginStateStore.userInfo.userId : null" :lazy="false"
                    :width="48"></Avator>
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

<style lang="scss" scoped>
.header-bar {
    height: 64px;
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
            background-color: #f1f2f3;
            opacity: 0.8;
            border-radius: 8px;
            padding: 0 10px;
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
                height: 30px;
                background-color: #f1f2f3;
                opacity: inherit;

                &:focus {
                    border-radius: 5px;
                    background-color: #c6c6c6;
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

        .user-avator {
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
            background-color: #fb7299;
            border-color: #fb7299;

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
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);

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
