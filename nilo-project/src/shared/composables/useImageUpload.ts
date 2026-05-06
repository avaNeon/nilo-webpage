import { ref, type Ref, nextTick } from 'vue'
import { imageApi } from '@/shared/api/ImageApi'
import message from '@/shared/lib/message'
import type { AxiosProgressEvent } from 'axios'

/**
 * unit: bytes
 */
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB 

/** 上传过程中的状态 */
export type UploadStatus = 'idle' | 'selected' | 'uploading' | 'done' | 'error'

/** 单个上传项的状态 */
export interface UploadItem {
    /** 唯一标识 */
    id: string
    /** 原始 File 对象 */
    file: File
    /** 本地预览 URL（通过 URL.createObjectURL 生成） */
    localUrl: string
    /** 上传状态 */
    status: UploadStatus
    /** 上传进度百分比 0-100 */
    progress: number
    /** 上传成功后服务器返回的图片相对路径 */
    relativePath?: string
    /** 错误信息 */
    errorMsg?: string
}

/**
 * 图片上传 composable
 */
export function useImageUpload(options?: {
    /** 允许的 MIME 类型，默认 image/* */
    accept?: string
    /** 最大文件大小（字节），默认 10MB */
    maxSize?: number
    /** 是否创建缩略图 */
    createThumbnail?: boolean
    /** 是否在选择后立即自动上传 */
    autoUpload?: boolean
}) {
    const {
        accept = 'image/*',
        maxSize = MAX_IMAGE_SIZE, // 10MB
        createThumbnail = true,
        autoUpload = false,
    } = options ?? {}

    /** 隐藏的 file input 引用 */
    const inputRef: Ref<HTMLInputElement | null> = ref(null)
    /** 上传项列表 */
    const uploadItems: Ref<UploadItem[]> = ref([])
    /** 是否正在上传中（任一文件） */
    const isUploading = ref(false)

    /** 生成唯一 id */
    let idCounter = 0
    function genId() {
        return `upload_${Date.now()}_${++idCounter}`
    }

    /** 校验文件类型 */
    function validateType(file: File): boolean {
        // accept = 'image/*' 时检查 type 是否以 image/ 开头
        if (accept === 'image/*') {
            return file.type.startsWith('image/')
        }
        // 支持逗号分隔的 MIME 列表，如 'image/png,image/jpeg'
        const allowed = accept.split(',').map(t => t.trim())
        return allowed.some(t => {
            if (t.endsWith('/*')) {
                const prefix = t.replace('/*', '/')
                return file.type.startsWith(prefix)
            }
            return file.type === t
        })
    }

    /** 打开文件选择器 */
    function selectFile() {
        inputRef.value?.click()
    }

    /** 处理文件选择完成 */
    function onFilesSelected(event: Event) {
        const target = event.target as HTMLInputElement
        const files = target.files
        if (!files || files.length === 0) return

        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            if (!file) continue

            // 类型校验
            if (!validateType(file)) {
                message.error(`"${file.name}" 不是有效的图片格式`)
                continue
            }

            // 大小校验
            if (file.size > maxSize) {
                const mb = (maxSize / (1024 * 1024)).toFixed(1)
                message.error(`"${file.name}" 超过大小限制（${mb}MB）`)
                continue
            }

            const item: UploadItem = {
                id: genId(),
                file,
                localUrl: URL.createObjectURL(file),
                status: 'selected',
                progress: 0,
            }
            uploadItems.value.push(item)

            // 自动上传
            if (autoUpload) {
                startUpload(item)
            }
        }

        // 重置 input，允许重复选择同一个文件
        target.value = ''
    }

    /**
     * 开始上传指定项
     * @param item 上传项（从 uploadItems 中取）
     */
    async function startUpload(item: UploadItem) {
        // 必须从响应式数组中取出对应的 Proxy 对象再修改，
        // 直接修改传入的普通对象引用不会触发 Vue 的响应式更新。
        const reactiveItem = uploadItems.value.find(i => i.id === item.id)
        if (!reactiveItem) return
        if (reactiveItem.status === 'uploading') return

        isUploading.value = true
        reactiveItem.status = 'uploading'
        reactiveItem.progress = 0
        reactiveItem.errorMsg = undefined

        try {
            const serverPath = await imageApi.uploadImage(
                reactiveItem.file,
                createThumbnail,
                (event: AxiosProgressEvent) => {
                    // axios v1.x 自动计算的 0~1 进度值，比手动 loaded/total 更可靠
                    if (event.progress !== undefined) {
                        reactiveItem.progress = Math.round(event.progress * 100)
                    }
                    else if (event.lengthComputable && event.total !== undefined && event.total > 0) {
                        reactiveItem.progress = Math.round((event.loaded / event.total) * 100)
                    }
                },
            )

            if (serverPath) {
                reactiveItem.progress = 100
                // 确保 Vue 先把进度条渲染为 100%，再隐藏它
                await nextTick()
                reactiveItem.status = 'done'
                reactiveItem.relativePath = serverPath
            } else {
                reactiveItem.status = 'error'
                reactiveItem.errorMsg = '上传失败，服务器返回为空'
            }
        }
        catch (err: any) {
            reactiveItem.status = 'error'
            reactiveItem.errorMsg = err?.msg ?? err?.message ?? '上传异常'
        }
        finally {
            isUploading.value = false
        }
    }

    /** 上传所有处于 selected 状态的项 */
    async function uploadAll() {
        for (const item of uploadItems.value) {
            if (item.status === 'selected') {
                await startUpload(item)
            }
        }
    }

    /** 移除指定上传项（同时释放本地预览 URL） */
    function removeItem(id: string) {
        const index = uploadItems.value.findIndex(i => i.id === id)
        if (index !== -1) {
            const item = uploadItems.value[index]
            if (item) {
                URL.revokeObjectURL(item.localUrl)
            }
            uploadItems.value.splice(index, 1)
        }
    }

    /** 重置全部状态 */
    function reset() {
        uploadItems.value.forEach(item => URL.revokeObjectURL(item.localUrl))
        uploadItems.value = []
        isUploading.value = false
    }

    return {
        /** 绑定到隐藏 <input> 的 ref */
        inputRef,
        /** 上传项列表 */
        uploadItems,
        /** 是否正在上传 */
        isUploading,
        /** 打开文件选择器 */
        selectFile,
        /** input change 事件处理器 */
        onFilesSelected,
        /** 开始上传指定项 */
        startUpload,
        /** 上传所有待上传项 */
        uploadAll,
        /** 移除指定项 */
        removeItem,
        /** 重置全部 */
        reset,
    }
}
