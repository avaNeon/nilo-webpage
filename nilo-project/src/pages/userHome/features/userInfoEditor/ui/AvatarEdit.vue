<script lang="ts" setup>
import { ref, useTemplateRef } from 'vue'
import { VueCropper } from 'vue-cropper'
import 'vue-cropper/dist/index.css'
import { RefreshLeft, RefreshRight } from '@element-plus/icons-vue'

const props = withDefaults(defineProps<{
    modelValue: boolean
    imgSrc: string
    title?: string
}>(), {
    title: '裁剪头像',
})

const emit = defineEmits<{
    (e: 'crop', blob: Blob): void
    (e: 'cancel'): void
}>()

const cropperRef = useTemplateRef<InstanceType<typeof VueCropper>>('cropperRef')
const isCropping = ref(false)

function handleClose()
{
    emit('cancel')
}

function rotateLeft()
{
    cropperRef.value?.rotateLeft()
}

function rotateRight()
{
    cropperRef.value?.rotateRight()
}

function createRoundAvatarBlob(blob: Blob)
{
    return new Promise<Blob>((resolve, reject) =>
    {
        const img = new Image()
        const url = URL.createObjectURL(blob)

        img.onload = () =>
        {
            const size = Math.min(img.naturalWidth, img.naturalHeight)
            const sx = (img.naturalWidth - size) / 2
            const sy = (img.naturalHeight - size) / 2
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')

            if (!ctx)
            {
                URL.revokeObjectURL(url)
                reject(new Error('Canvas context is unavailable'))
                return
            }

            canvas.width = size
            canvas.height = size
            ctx.clearRect(0, 0, size, size)
            ctx.save()
            ctx.beginPath()
            ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
            ctx.closePath()
            ctx.clip()
            ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size)
            ctx.restore()

            canvas.toBlob((roundBlob) =>
            {
                URL.revokeObjectURL(url)
                if (roundBlob)
                {
                    resolve(roundBlob)
                    return
                }

                reject(new Error('Failed to create avatar blob'))
            }, 'image/png')
        }

        img.onerror = () =>
        {
            URL.revokeObjectURL(url)
            reject(new Error('Failed to load cropped avatar'))
        }

        img.src = url
    })
}

function confirmCrop()
{
    if (isCropping.value) return
    if (!cropperRef.value) return

    isCropping.value = true
    cropperRef.value?.getCropBlob(async (blob: Blob) =>
    {
        try
        {
            const roundBlob = await createRoundAvatarBlob(blob)
            emit('crop', roundBlob)
        }
        finally
        {
            isCropping.value = false
        }
    })
}
</script>

<template>
    <el-dialog :model-value="props.modelValue" :title="title" width="620px" :close-on-click-modal="false"
        @close="handleClose">
        <div class="avatar-cropper-wrapper">
            <VueCropper v-if="props.modelValue" ref="cropperRef" :img="imgSrc" :output-size="1" output-type="png"
                :auto-crop="true" :fixed="true" :fixed-number="[1, 1]" :center-box="true" :can-scale="true"
                :can-rotate="true" :info="true" :full="true" :high="true" mode="contain" />
        </div>

        <template #footer>
            <div class="avatar-cropper-footer">
                <div class="avatar-cropper-actions-left">
                    <el-button title="左旋 90°" :icon="RefreshLeft" circle @click="rotateLeft" />
                    <el-button title="右旋 90°" :icon="RefreshRight" circle @click="rotateRight" />
                </div>
                <div class="avatar-cropper-actions-right">
                    <el-button @click="handleClose">取消</el-button>
                    <el-button type="primary" :loading="isCropping" @click="confirmCrop">确定</el-button>
                </div>
            </div>
        </template>
    </el-dialog>
</template>

<style lang="scss" scoped>
.avatar-cropper-wrapper {
    width: 100%;
    height: 420px;
    overflow: hidden;

    :deep(.cropper-view-box),
    :deep(.cropper-face) {
        border-radius: 50%;
    }
}

.avatar-cropper-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
}

.avatar-cropper-actions-left,
.avatar-cropper-actions-right {
    display: flex;
    gap: 8px;
}
</style>
