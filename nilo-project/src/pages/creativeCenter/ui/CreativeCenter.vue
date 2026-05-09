<script lang="ts" setup>
import Avatar from '@/entities/avatar/ui/Avatar.vue';
import { imgRequestUrl } from '@/shared/utils/ImgUtil';
import { useCreativeCenter } from '../composables/useCreativeCenter';
import { useRoute } from 'vue-router';

const { router, loginStateStore, cancelActive } = useCreativeCenter()
const route = useRoute()
</script>

<template>
    <div class="content">
        <div class="header">
            <div class="left">
                <nav class="index" @click="router.push('/')">
                    <span class="iconfont icon-logo">首页</span>
                </nav>
            </div>
            <div class="right">
                <nav class="avatar">
                    <Avatar :src="loginStateStore.userInfo ? imgRequestUrl(loginStateStore.userInfo.avatar) : ''"
                        :user-id="loginStateStore.userInfo ? loginStateStore.userInfo.userId : null" :lazy="false"
                        :width="48" :user-panel="false" :mobile="false">
                    </Avatar>
                </nav>
            </div>
        </div>

        <div class="body">
            <div class="left">
                <el-button class="post-button" type="primary" @click="() =>
                {
                    router.push('/cc/upload')
                    cancelActive()
                }">投稿</el-button>
                <el-menu class="menu-vertical" text-color="#363636" active-text-color="#00AEEC"
                    background-color="#ffffff" :default-active="route.name === 'videoUpload' ? '0' : '1'"
                    :default-openeds="['2', '3']">
                    <!-- fake item, it's for clear active style below-->
                    <el-menu-item id="hidden-element" index="0" style="height: 0;" />
                    <el-menu-item index="1" @click="router.push('/cc/home')">
                        <span class="iconfont icon-home">首页</span>
                    </el-menu-item>
                    <el-sub-menu index="2">
                        <template #title>
                            <span class="iconfont icon-file-management">内容管理</span>
                        </template>
                        <el-menu-item index="2-1">稿件管理</el-menu-item>
                    </el-sub-menu>
                    <el-sub-menu index="3">
                        <template #title>
                            <span class="iconfont icon-zhuanqu_huabanfuben">互动管理</span>
                        </template>
                        <el-menu-item index="3-1">评论管理</el-menu-item>
                        <el-menu-item index="3-2">弹幕管理</el-menu-item>
                    </el-sub-menu>
                </el-menu>

            </div>
            <div class="right">
                <div class="main-content">
                    <router-view />
                </div>
            </div>
        </div>
    </div>

</template>

<style lang="scss" scoped>
.content {
    background-color: white;
    min-height: 90.5vh;

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        padding: 10px 20px;

        border-bottom: 1px solid $color-neutral-2;

        .left {

            .index {
                cursor: pointer;
            }
        }
    }

    .body {
        display: flex;
        justify-content: space-between;

        .left {
            display: flex;
            flex-direction: column;
            align-items: center;

            .post-button {
                margin: 20px 0;
                width: 100px;
                font-size: 14px;
            }

            .menu-vertical {
                width: 100%;

                .iconfont {
                    font-size: 14px;
                    font-weight: 500;

                    &::first-letter {
                        margin-right: 16px;
                    }
                }
            }
        }

        .right {
            flex: 1;
            // margin: 25px;
            // border-radius: 100px;
            // box-shadow: 0 0 20px 20px $color-neutral-1 ;
        }
    }
}
</style>

<style></style>