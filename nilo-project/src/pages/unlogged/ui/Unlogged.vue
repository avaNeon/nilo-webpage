<script lang="ts" setup>
import { useRouter } from 'vue-router';
import { ElButton } from 'element-plus';

const router = useRouter();

function goHome()
{
    router.push('/');
}
</script>

<template>
    <div class="unlogged">
        <div class="bg-shape bg-shape--left"></div>
        <div class="bg-shape bg-shape--right"></div>

        <div class="content">
            <div class="icon-wrap">
                <span class="iconfont icon-user"></span>
            </div>
            <h1 class="title">请先登录</h1>
            <p class="hint">该页面需要登录后才能访问</p>
            <p class="sub-hint">返回首页登录后即可继续浏览</p>
            <ElButton class="home-button" type="primary" round @click="goHome">返回首页</ElButton>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.unlogged {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    overflow: hidden;
    background: linear-gradient(160deg, #f0f9ff 0%, #ffffff 45%, #f8fbff 100%);

    .bg-shape {
        position: absolute;
        border-radius: 50%;
        pointer-events: none;

        &--left {
            top: -120px;
            left: -80px;
            width: 320px;
            height: 320px;
            background: radial-gradient(circle, rgba($color-bilibili-blue, 0.12) 0%, transparent 70%);
        }

        &--right {
            right: -100px;
            bottom: -100px;
            width: 400px;
            height: 400px;
            background: radial-gradient(circle, rgba($color-bilibili-blue, 0.08) 0%, transparent 70%);
        }
    }

    .content {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        max-width: 420px;
        padding: 48px 32px;
        text-align: center;
    }

    .icon-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 96px;
        height: 96px;
        border-radius: 50%;
        background: linear-gradient(145deg, rgba($color-bilibili-blue, 0.15), rgba($color-bilibili-blue, 0.06));
        box-shadow: 0 8px 32px rgba($color-bilibili-blue, 0.12);

        .iconfont {
            font-size: 44px;
            color: $color-bilibili-blue;
        }
    }

    .title {
        margin: 28px 0 0;
        font-size: 26px;
        font-weight: 600;
        color: $color-text-primary;
        letter-spacing: 0.5px;
    }

    .hint {
        margin: 12px 0 0;
        font-size: 16px;
        line-height: 1.6;
        color: $color-text-secondary;
    }

    .sub-hint {
        margin: 6px 0 0;
        font-size: 14px;
        line-height: 1.6;
        color: $color-text-muted;
    }

    .home-button {
        margin-top: 32px;
        padding: 10px 40px;
        font-size: 15px;
    }
}
</style>
