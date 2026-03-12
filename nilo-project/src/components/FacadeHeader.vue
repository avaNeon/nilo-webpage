<script setup lang="ts">
const props = withDefaults(defineProps<{ theme?: string }>(), {
    theme: "light"
}) // theme属性，可以是light或dark，默认为light
</script>

<template>
    <div :class="['header-bar', 'header-bar-' + props.theme]">
        <div class="menu">
            <RouterLink to="/facade" class="iconfont icon-logo">首页</RouterLink>
            <nav></nav>
        </div>
        <div class="search">
            <div class="search-bar">
                <div class="search-bar-main">
                    <input />
                    <div class="iconfont icon-search"></div>
                </div>
            </div>
        </div>
        <div class="user">
            <img class="user-avator" src="../assets/user.png" />
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

        .search-bar {
            width: 100%;
        }

        .search-bar-main {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: #f1f2f3de;
            border-radius: 8px;
            padding: 0 10px;
            height: 36px;

            &:hover {
                background-color: #f1f2f3;
            }

            input {
                flex: 1;
                border: none;
                background: none;
                outline: none;
                height: 34px;
            }

            .icon-search {
                color: #18191c;
                font-size: 18px;
                cursor: pointer;
            }
        }
    }

    .user {
        display: flex;
        justify-content: flex-end;
        align-items: center;

        .user-avator {
            width: 48px;
            border-radius: 50%;
            margin-right: 20px;
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
