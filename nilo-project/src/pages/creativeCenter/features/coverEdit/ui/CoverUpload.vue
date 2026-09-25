<script lang="ts" setup>
import { useCoverUpload } from '../model/useCoverUpload'
import CoverEdit from './CoverEdit.vue'
import { computed, watch } from 'vue'
import { imgRequestUrl, resolveImageUrl } from '@/shared/utils/ImgUtil'
import { useSystemConfigStore } from '@/shared/store/SystemConfigStore'

const emit = defineEmits<{
  (e: 'update:coverBlob', blob: Blob | null): void
  (e: 'update:coverQuotaBytes', bytes: number): void
}>()
const props = defineProps<{
  initialCoverPath?: string
  disabled?: boolean
}>()

const systemConfigStore = useSystemConfigStore()

/** 封面大小上限（MB），和 useCoverUpload 的默认值一致 */
const maxSizeMB = computed(() => systemConfigStore.imageMaxSize > 0 ? systemConfigStore.imageMaxSize : 10)

const {
  editVisible,
  originalCoverUrl,
  currentCoverUrl,
  currentCoverBlob,
  currentCoverQuotaBytes,
  selectFile,
  updateImgUrl,
  openCropper,
  setCoverFromRemote,
} = useCoverUpload()

function pickCover()
{
  if (props.disabled) return
  selectFile()
}

// 每次 currentCoverBlob 变化（选择新文件 / 裁剪确认）时同步到父组件
watch(currentCoverBlob, (blob) =>
{
  emit('update:coverBlob', blob)
})

watch(currentCoverQuotaBytes, (bytes) =>
{
  emit('update:coverQuotaBytes', bytes)
})

watch(() => props.initialCoverPath, async (coverPath) =>
{
  if (!coverPath || currentCoverBlob.value) return
  try
  {
    // 编辑预载：先试 public（二次修改未换封面时常仍在公开桶），失败再 pending
    try
    {
      await setCoverFromRemote(imgRequestUrl(coverPath))
      return
    }
    catch
    {
      // public 不存在或不可读时回退
    }
    const pendingUrl = await resolveImageUrl(coverPath)
    if (pendingUrl) await setCoverFromRemote(pendingUrl)
  } catch
  {
    // 预加载失败可忽略，用户可重新选封面
  }
}, { immediate: true })
</script>

<template>
  <div class="cover-upload">
    <!-- 裁剪弹窗：model-value 单向绑定，由 editVisible 控制显隐 -->
    <CoverEdit :model-value="editVisible" :img-src="originalCoverUrl" @crop="updateImgUrl"
      @cancel="editVisible = false" />

    <!-- 16:9 预览，点击选择封面 -->
    <button type="button" :class="['cover-preview', { empty: !currentCoverUrl }]" :disabled="disabled"
      :aria-label="currentCoverUrl ? '更换封面' : '选择封面'" @click="pickCover">
      <img v-if="currentCoverUrl" :src="currentCoverUrl" alt="封面预览" />
      <span v-else class="cover-placeholder">点击选择封面 · 16:9</span>
    </button>

    <div class="cover-side">
      <div class="cover-actions">
        <button type="button" class="pick-button" :disabled="disabled" @click="pickCover">
          {{ currentCoverUrl ? '更换封面' : '选择封面' }}
        </button>
        <button v-if="currentCoverUrl" type="button" class="crop-button" :disabled="disabled" @click="openCropper">
          裁剪封面
        </button>
      </div>
      <span class="cover-hint">
        JPG / PNG / WebP 等，不超过 {{ maxSizeMB }}MB，自动裁成 16:9<br>计入今日图片上传额度
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/pages/creativeCenter/shared/styles/cc' as *;

.cover-upload {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 20px;
}

.cover-preview {
  @include reset-button;
  position: relative;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 320px;
  height: 180px;
  overflow: hidden;
  border-radius: 20px;
  background: repeating-linear-gradient(135deg, #F3F4F7 0 10px, #ECEEF2 10px 20px);

  // 描边盖在图片上面
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: inset 0 0 0 1px rgba(11, 12, 18, 0.06);
    pointer-events: none;
  }

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &.empty:hover:not(:disabled) .cover-placeholder {
    color: $warm-accent;
  }
}

.cover-placeholder {
  @include mono(11px);
  letter-spacing: 0.1em;
  color: $warm-ink-4;
  transition: color 0.2s;
}

.cover-side {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cover-actions {
  display: flex;
  gap: 8px;
}

.pick-button {
  @include ink-button(40px, 0 20px, 13px);

  &:disabled {
    opacity: 0.4;
  }
}

.crop-button {
  @include soft-pill(40px, 0 18px, 13px);

  &:disabled {
    opacity: 0.4;
  }
}

.cover-hint {
  font-size: 12px;
  line-height: 1.6;
  color: $warm-ink-4;
}
</style>
