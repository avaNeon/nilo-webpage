<script lang="ts" setup>
import { ref } from 'vue'
import { ElButton } from 'element-plus'
import { watch } from 'vue'

interface DialogConfig {
    show?: boolean,
    top?: number,
    width?: number | string,
    draggable?: boolean,
    showClose?: boolean,
    title?: string,
    padding?: number | string,
    showCancel?: boolean,
    handleClose?(): any,
    buttons?: Array<{
        type?: "" | "default" | "primary" | "success" | "warning" | "info" | "danger" | "text",
        text: string,
        order: number /*数字越大越靠后*/,
        click(): any
    }>,
    borderRadius?: number | string,
}

const props = withDefaults(defineProps<DialogConfig>(), {
    show: false,
    top: 200,
    width: 500,
    draggable: false,
    showClose: true,
    title: 'title',
    padding: 20,
    showCancel: true,
    handleClose() { },
    borderRadius: 10,
})

// 计算内容区最大高度
const maxHeight = ref(0)
maxHeight.value = window.innerHeight - props.top - 120
// 调整窗口是否可见的变量
const dialogVisible = ref(false)

watch(() => props.show, (newVal) => {
    dialogVisible.value = newVal
}, { immediate: true })

</script>

<template>
    <el-dialog class="dialog" v-model="dialogVisible" :top="top + 'px'" :width="width" :draggable="draggable"
        :show-close="showClose" :close-on-click-modal="false" @close="handleClose"
        :style="{ 'border-radius': borderRadius + 'px' }">
        <template #header="{ titleId, titleClass }">
            <div v-if="title" :id="titleId" :class="titleClass">{{ title }}</div>
            <slot v-else name="header"></slot>
        </template>
        <div class="dialog-body" :style="{
            'maxHeight': maxHeight,
            'padding': padding + 'px',
        }">
            <slot></slot>
        </div>
        <template #footer v-if="(buttons && buttons.length > 0) || showCancel">
            <div class="dialog-footer">
                <el-button link v-if="showCancel" @click="dialogVisible = false">取消</el-button>
                <el-button v-for="btn in buttons" :key="btn.order" :type="btn.type || 'primary'" @click="btn.click">
                    {{ btn.text }}
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<style lang="scss" scoped>
.dialog {
    margin: 0 auto;
}
</style>