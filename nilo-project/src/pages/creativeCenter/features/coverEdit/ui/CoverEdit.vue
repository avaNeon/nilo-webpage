<script lang="ts" setup>
import { useTemplateRef } from 'vue'
import { VueCropper } from 'vue-cropper'
import 'vue-cropper/dist/index.css'
import { RefreshLeft, RefreshRight } from '@element-plus/icons-vue'
import { useCoverEdit } from '../model/useCoverEdit'

// ==================== Props ====================
interface Props
{
    /** v-model 控制弹窗显隐 */
    modelValue: boolean
    /** 待裁剪的图片（URL 或 Base64） */
    imgSrc: string
    /** 裁剪宽高比 [宽, 高]，默认 16:9 */
    fixedNumber?: number[]
    /** 输出图片格式 */
    outputType?: 'jpeg' | 'png' | 'webp'
    /** 输出图片质量 0~1，默认 0.9 */
    outputSize?: number
    /** 弹窗标题 */
    title?: string
}

const props = withDefaults(defineProps<Props>(), {
    fixedNumber: () => [16, 9],
    outputType: 'jpeg',
    outputSize: 1.0,
    title: '编辑封面',
})

// ==================== Emits ====================
const emit = defineEmits<{
    /** 裁剪确认后返回 Blob，由父组件决定上传时机 */
    (e: 'crop', blob: Blob): void
    (e: 'cancel'): void
}>()

// ==================== 逻辑 ====================
const cropperRef = useTemplateRef<InstanceType<typeof VueCropper>>('cropperRef')
const {
    handleClose,
    rotateLeft,
    rotateRight,
    confirmCrop,
} = useCoverEdit({
    cropperRef,
    onCrop: (blob) => emit('crop', blob),
    onCancel: () => emit('cancel'),
})
</script>

<template>
    <el-dialog :model-value="props.modelValue" :title="title" width="680px" :close-on-click-modal="false"
        @close="handleClose">
        <!-- 裁剪区域 -->
        <div class="cropper-wrapper">
            <VueCropper v-if="props.modelValue" ref="cropperRef" :img="imgSrc" :output-size="outputSize"
                :output-type="outputType" :auto-crop="true" :fixed="true" :fixed-number="fixedNumber" :center-box="true"
                :can-scale="true" :can-rotate="true" :info="true" :full="true" :high="true" mode="contain" />
        </div>

        <!-- 底部操作栏 -->
        <template #footer>
            <div class="cropper-footer">
                <div class="cropper-actions-left">
                    <el-button title="左旋 90°" :icon="RefreshLeft" circle @click="rotateLeft" />
                    <el-button title="右旋 90°" :icon="RefreshRight" circle @click="rotateRight" />
                </div>
                <div class="cropper-actions-right">
                    <el-button @click="handleClose">取消</el-button>
                    <el-button type="primary" @click="confirmCrop">确定</el-button>
                </div>
            </div>
        </template>
    </el-dialog>
</template>

<style lang="scss" scoped>
.cropper-wrapper {
    width: 100%;
    height: 420px;
    overflow: hidden;
}

.cropper-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
}

.cropper-actions-left {
    display: flex;
    gap: 8px;
}

.cropper-actions-right {
    display: flex;
    gap: 8px;
}
</style>
