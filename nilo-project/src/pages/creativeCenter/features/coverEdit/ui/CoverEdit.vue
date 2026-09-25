<script lang="ts" setup>
import { useTemplateRef } from 'vue'
import { VueCropper } from 'vue-cropper'
import 'vue-cropper/dist/index.css'
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
    <el-dialog :model-value="props.modelValue" :title="title" width="680px" class="cc-cover-dialog" append-to-body
        :close-on-click-modal="false" @close="handleClose">
        <!-- 裁剪区域 -->
        <div class="cropper-wrapper">
            <VueCropper v-if="props.modelValue" ref="cropperRef" :img="imgSrc" :output-size="outputSize"
                :output-type="outputType" :auto-crop="true" :fixed="true" :fixed-number="fixedNumber" :center-box="true"
                :can-scale="true" :can-rotate="true" :info="true" :full="true" :high="true" mode="contain" />
        </div>

        <!-- 底部操作栏 -->
        <template #footer>
            <div class="cropper-footer">
                <div class="cropper-actions">
                    <button type="button" class="rotate-button" title="左旋 90°" aria-label="左旋 90°"
                        @click="rotateLeft">↺</button>
                    <button type="button" class="rotate-button" title="右旋 90°" aria-label="右旋 90°"
                        @click="rotateRight">↻</button>
                </div>
                <div class="cropper-actions">
                    <button type="button" class="cancel-button" @click="handleClose">取消</button>
                    <button type="button" class="confirm-button" @click="confirmCrop">确定</button>
                </div>
            </div>
        </template>
    </el-dialog>
</template>

<style lang="scss" scoped>
@use '@/pages/creativeCenter/shared/styles/cc' as *;

.cropper-wrapper {
    width: 100%;
    height: 420px;
    overflow: hidden;
    border-radius: 16px;
}

.cropper-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
}

.cropper-actions {
    display: flex;
    gap: 8px;
}

.rotate-button {
    @include soft-pill(40px, 0, 18px);
    justify-content: center;
    width: 40px;
    font-weight: 400;
}

.cancel-button {
    @include soft-pill(40px, 0 20px, 13px);

    &:hover:not(:disabled) {
        background: $warm-sunken-hover;
        color: $warm-ink;
    }
}

.confirm-button {
    @include accent-button(40px, 0 22px, 13px);
}
</style>

<style lang="scss">
// 弹窗挂在 body 上，只能用类名限定
.el-dialog.cc-cover-dialog {
    padding: 24px;
    border-radius: 28px;
}
</style>
