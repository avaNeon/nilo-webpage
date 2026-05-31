<script lang="ts" setup>
const props = withDefaults(defineProps<{
    message?: string
}>(), {
    message: '暂无数据'
})
</script>

<template>
    <div class="container">
        <div class="iconfont icon-empty"></div>
        <div class="message">{{ props.message }}</div>
    </div>
</template>

<style lang="scss" scoped>
.container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 25px 10px;

    .iconfont {
        font-size: 40px;
        color: rgb(200, 200, 200);
    }

    .message {
        margin-top: 20px;
        font-size: 16px;
        color: rgb(150, 150, 150);
    }
}
</style>