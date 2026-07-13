<script lang="ts" setup>
import { Platform } from '@element-plus/icons-vue'

const props = withDefaults(defineProps<{
    message?: string
}>(), {
    message: '暂无数据'
})
</script>

<template>
    <div class="container">
        <el-icon :size="40">
            <Platform />
        </el-icon>
        <div class="message">{{ props.message }}</div>
    </div>
</template>

<style lang="scss" scoped>
.container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 25px 10px;

    .message {
        margin-top: 20px;
        font-size: 16px;
        color: rgb(150, 150, 150);
    }
}
</style>