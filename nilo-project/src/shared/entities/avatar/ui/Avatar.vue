<script lang="ts" setup>
import Cover from '@/shared/ui/Cover.vue';
import userSvg from '@/assets/user.svg';
import loginSvg from '@/assets/login.svg';
import { useAvatar } from '../model/useAvatar';

const props = withDefaults(defineProps<{
    userId: string | null,
    src: string,
    width: number,
    lazy: boolean,
    userPanel?: boolean,
    mobile?: boolean,
    requireLogin?: boolean,
}>(), {
    userId: null,
    userPanel: true,
    mobile: true,
    requireLogin: true,
})

const { loginStateStore, clickLogin, logout } = useAvatar()
</script>

<template>
    <!-- 如果用户已登录，则显示用户头像，如果找不到用户头像则显示默认头像 -->
    <!-- requireLogin=false 时（如展示视频发布者/评论者头像），始终显示头像，不检查登录状态 -->
    <div class="onLogin" v-if="loginStateStore.loginState || !requireLogin">
        <RouterLink :class="{ 'avatar': true, 'mobile': mobile }" :to="`/user/${userId}`" target="_blank">
            <Cover :src="src" :lazy="lazy" :default-src="userSvg" :width="width" :scale="1" fit="cover"
                border-radius="50%" border="1px #bfbfbf solid">
            </Cover>
        </RouterLink>
        <div class="user-panel" v-if="userPanel">
            <span class="nickName">{{ loginStateStore.userInfo?.nickName }}</span>
            <div class="coin">
                <img src="@/assets/coin.svg" alt="coin" style="width: 12px; margin-right: 5px;">
                <span class="coin-text">硬币:</span>
                <span class="amount">{{ loginStateStore.currentCoin != null ? loginStateStore.currentCoin : '-'
                }}</span>
            </div>
            <div class="user-relation">
                <div class="relation-item">
                    <span class="item-number">{{ loginStateStore.followingCount != null ?
                        loginStateStore.followingCount : '-' }}</span>
                    <span>关注</span>
                </div>
                <div class="relation-item">
                    <span class="item-number">{{ loginStateStore.followerCount != null ? loginStateStore.followerCount :
                        '-' }}</span>
                    <span>粉丝</span>
                </div>
            </div>
            <RouterLink class="user-option" :to="`/user/${userId}`" target="_blank">
                <span class="option iconfont icon-user">个人中心</span>
                <span class="right-arrow">></span>
            </RouterLink>
            <RouterLink class="user-option" :to="`/cc/video`" target="_blank">
                <span class="option iconfont icon-play">投稿管理</span>
                <span class="right-arrow">></span>
            </RouterLink>
            <div class="user-option" @click="logout">
                <span class="option iconfont icon-logout">退出登录</span>
                <span class="right-arrow">></span>
            </div>
        </div>
    </div>
    <!-- 未登录时显示登录头像，src不传 -->
    <div class="notLogin" v-else>
        <Cover :src="src" :lazy="lazy" :default-src="loginSvg" :width="width" :scale="1" fit="scale-down"
            border-radius="50%" border="2px white solid" @click="clickLogin"></Cover>
    </div>
</template>

<style lang="scss" scoped>
.onLogin {
    position: relative;
    z-index: 500;

    &:hover {
        .avatar.mobile {
            transform: translate(-20px, 20px) scale(1.6);
            transition: all 0.2s 0s ease;
        }

        .user-panel {
            opacity: 1;
            visibility: visible;
            /* 
               计算逻辑：
               1. 基础位移：left: 50%, top: 50%, translateX(-50%) 让面板顶部中点对齐头像中心。
               2. 同步移动：加上和头像一样的 translate(-30px, 30px)。
               3. 保持相对位置：因为缩放中心默认是中心，而我们希望"顶部中点"对齐"头像中心"，
                  所以通过 transform-origin: top center 将缩放原点固定在面板顶部中点。
                  这样放大时面板会向四周扩散，但顶部中点依然死死钉在头像中心。
            */
            transform-origin: top center;
            transform: translate(calc(-50% - 20px), 20px) scale(1.3);
            transition: all 0.2s 0s ease;
        }
    }

    .avatar {
        display: inline-block;
        cursor: pointer;
        position: relative;
        z-index: 500;
        transition: all 0.2s 0.1s ease;
    }

    .user-panel {
        opacity: 0;
        visibility: hidden;
        position: absolute;
        // 定位到 avatar 的中心点高度
        top: 50%;
        left: 50%;
        // 核心：translateX(-50%) 确保水平居中，此时顶部正好在父容器 (onLogin) 的 50% 位置
        transform: translateX(-50%);
        width: 230px;
        background-color: white;
        box-shadow: 0 2px 8px $color-shadow-sm;
        border-radius: 4px;
        padding: 10px;
        z-index: 400;
        transition: all 0.2s 0.1s ease;

        padding: 30px 10px 20px;
        display: flex;
        flex-direction: column;
        align-items: center;

        .nickName {
            font-size: 16px;
            font-weight: 500;
            color: black;
        }

        .coin {
            font-size: 10px;
            font-weight: 400;
            color: black;
            display: flex;
            align-items: center;
            margin: 5px 0;

            .coin-text {
                font-size: 10px;
                color: $color-text-muted;
                margin-right: 5px;
            }
        }

        .user-relation {
            margin: 10px 0;
            justify-content: space-between;
            display: flex;

            .relation-item {
                width: 100px;
                font-size: 10px;
                color: $color-text-muted;
                display: flex;
                flex-direction: column;
                align-items: center;

                .item-number {
                    font-size: 16px;
                    font-weight: bold;
                    color: black;
                }
            }
        }

        .user-option {
            width: 180px;
            height: 30px;
            border-radius: 7px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 10px;
            margin: 3px 0;
            cursor: pointer;
            text-decoration: none;

            &:hover {
                background-color: $color-neutral-3;
            }

            .option {
                color: $color-text-muted;
                font-size: 11px;
                font-weight: 600;

                &::before {
                    margin-right: 10px;
                }
            }

            .right-arrow {
                color: $color-text-muted;
                font-size: 11px;
                font-weight: 600;
            }
        }
    }
}
</style>
