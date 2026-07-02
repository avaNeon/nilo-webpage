<script lang="ts" setup>
import { useRouter } from 'vue-router';
import { ElButton } from 'element-plus';

const props = withDefaults(defineProps<{
    title?: string;
    hint?: string;
    showHomeButton?: boolean;
}>(), {
    title: '页面不存在',
    hint: '您访问的内容可能已被删除或链接有误',
    showHomeButton: true,
})

const router = useRouter();

function goHome()
{
    router.push('/');
}
</script>

<template>
    <div class="not-found">
        <img class="illustration" src="@/assets/404.png" alt="404" />
        <div class="title">{{ props.title }}</div>
        <div class="hint">{{ props.hint }}</div>
        <ElButton v-if="props.showHomeButton" class="home-button" type="primary" round @click="goHome">返回首页</ElButton>
    </div>
</template>

<style lang="scss" scoped>
.not-found {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 70vh;
    padding: 40px 20px;

    .illustration {
        width: 360px;
        max-width: 80vw;
        height: auto;
        user-select: none;
        -webkit-user-drag: none;
    }

    .title {
        margin-top: 24px;
        font-size: 24px;
        font-weight: 500;
        color: $color-text-primary;
    }

    .hint {
        margin-top: 8px;
        font-size: 15px;
        color: $color-text-secondary;
    }

    .home-button {
        margin-top: 28px;
        padding: 10px 36px;
        font-size: 16px;
    }
}
</style>
