<script lang="ts" setup>
import { useCoverUpload } from '../model/useCoverUpload'
import CoverEdit from './CoverEdit.vue'
import { watch } from 'vue'
import { imgRequestUrl } from '@/shared/utils/ImgUtil'

const emit = defineEmits<{
  (e: 'update:coverBlob', blob: Blob | null): void
}>()
const props = defineProps<{
  initialCoverPath?: string
  disabled?: boolean
}>()

const {
    editVisible,
    originalCoverUrl,
    currentCoverUrl,
    currentCoverBlob,
    selectFile,
    updateImgUrl,
    openCropper,
    setCoverFromRemote,
} = useCoverUpload()

// 每次 currentCoverBlob 变化（选择新文件 / 裁剪确认）时同步到父组件
watch(currentCoverBlob, (blob) => {
  emit('update:coverBlob', blob)
})

watch(() => props.initialCoverPath, async (coverPath) => {
  if (!coverPath || currentCoverBlob.value) return
  try {
    await setCoverFromRemote(imgRequestUrl(coverPath))
  } catch {
    // ignore preload failure, user can still reselect cover manually
  }
}, { immediate: true })
</script>

<template>
    <!-- 裁剪弹窗：model-value 单向绑定，由父组件 editVisible 控制显隐。
         CoverEdit 直接使用 props.modelValue（响应式），无需内部 watch 同步。 -->
    <CoverEdit :model-value="editVisible" :img-src="originalCoverUrl" @crop="updateImgUrl"
        @cancel="editVisible = false" />

    <div class="content">
        <!-- 封面预览区 -->
        <div v-if="currentCoverUrl" class="cover-preview">
            <img :src="currentCoverUrl" alt="封面预览" />
        </div>

        <!-- 操作按钮区（始终显示在预览图下方） -->
        <div class="cover-actions">
            <el-button type="primary" :disabled="disabled" @click="selectFile">
                {{ currentCoverUrl ? '替换封面' : '选择封面' }}
            </el-button>
            <el-button v-if="currentCoverUrl" :disabled="disabled" @click="openCropper">
                裁剪封面
            </el-button>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
}

.cover-preview {
    width: 100%;
    max-width: 480px;

    img {
        width: 100%;
        height: auto;
        border-radius: 4px;
        object-fit: contain;
    }
}

.cover-actions {
    display: flex;
    gap: 12px;
}
</style>
