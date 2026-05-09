import { type Ref } from 'vue'
import { VueCropper } from 'vue-cropper'

export function useCoverEdit(options: {
    cropperRef: Ref<InstanceType<typeof VueCropper> | undefined>
    onCrop: (blob: Blob) => void
    onCancel: () => void
})
{
    /** 关闭弹窗（取消按钮 / el-dialog @close） */
    function handleClose()
    {
        options.onCancel()
    }

    /** 左旋 90° */
    function rotateLeft()
    {
        options.cropperRef.value?.rotateLeft()
    }

    /** 右旋 90° */
    function rotateRight()
    {
        options.cropperRef.value?.rotateRight()
    }

    /** 确认裁剪，返回 Blob */
    function confirmCrop()
    {
        options.cropperRef.value?.getCropBlob((blob: Blob) =>
        {
            options.onCrop(blob)
        })
    }

    /** 获取裁剪后的 Base64（仅预览用） */
    function getCropData()
    {
        return new Promise<string>((resolve) =>
        {
            options.cropperRef.value?.getCropData((data: string) => resolve(data))
        })
    }

    /** 获取裁剪后的 Blob */
    function getCropBlob()
    {
        return new Promise<Blob>((resolve) =>
        {
            options.cropperRef.value?.getCropBlob((blob: Blob) => resolve(blob))
        })
    }

    return {
        handleClose,
        rotateLeft,
        rotateRight,
        confirmCrop,
        getCropData,
        getCropBlob,
    }
}
