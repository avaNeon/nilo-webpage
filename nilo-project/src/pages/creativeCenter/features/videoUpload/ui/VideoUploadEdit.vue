<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import CcPageHeader from '@/pages/creativeCenter/shared/ui/CcPageHeader.vue'
import CcSegmented from '@/pages/creativeCenter/shared/ui/CcSegmented.vue'
import CcCheckChip from '@/pages/creativeCenter/shared/ui/CcCheckChip.vue'
import CoverUpload from '@/pages/creativeCenter/features/coverEdit/ui/CoverUpload.vue'
import VideoTag from '@/pages/creativeCenter/entities/videoTag/ui/VideoTag.vue'
import UploadQuotaPanel from './UploadQuotaPanel.vue'
import VideoDropZone from './VideoDropZone.vue'
import VideoPartList from './VideoPartList.vue'
import CategoryDropdown from './CategoryDropdown.vue'
import UploadSuccess from './UploadSuccess.vue'
import { useVideoUpload } from '../model/useVideoUpload'
import { useVideoUploadConfig } from '../model/useVideoUploadConfig'
import { VIDEO_ACCEPT } from '../model/videoFileTypes'

const router = useRouter()

const { MAX_INTRODUCTION_LENGTH, MAX_TITLE_LENGTH } = useVideoUploadConfig()

const {
  form,
  coverBlob,
  tagList,
  closeDanmaku,
  closeComment,
  introductionCharCount,
  activePreuploadList,
  failedTransferList,
  addVideoFiles,
  removeItem,
  returnToUploadPanel,
  continueUpload,
  showForm,
  submitState,
  submitting,
  formResetKey,
  isEditMode,
  hasMissingExistingFileId,
  maxVideoEpisodes,
  hasExceededVideoEpisodes,
  missingFields,
  canSubmit,
  isUploadingFiles,
  uploadPercent,
  videoQuota,
  imageQuota,
  quotaLoading,
  setCoverQuotaBytes,
  categoryOptions,
  selectedParentNumber,
  selectedChildNumber,
  childCategoryOptions,
  selectParentCategory,
  selectChildCategory,
  submitVideo,
} = useVideoUpload()

const POST_TYPE_OPTIONS = [
  { label: '自制', value: 1 },
  { label: '转载', value: 2 },
]

/* —————— 选择视频文件：拖拽区和「继续添加文件」共用一个文件框 —————— */

const fileInputRef = useTemplateRef<HTMLInputElement>('fileInputRef')

function openFilePicker()
{
  if (submitting.value) return
  fileInputRef.value?.click()
}

function onFileInputChange(event: Event)
{
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  // 清空，允许再次选择同一个文件
  input.value = ''
  addVideoFiles(files)
}

/** 文件拖到拖拽区外面松手时，别让浏览器直接打开文件把表单冲掉 */
function preventStrayFileDrop(event: DragEvent)
{
  if (event.dataTransfer?.types.includes('Files')) event.preventDefault()
}

onMounted(() =>
{
  window.addEventListener('dragover', preventStrayFileDrop)
  window.addEventListener('drop', preventStrayFileDrop)
})

onBeforeUnmount(() =>
{
  window.removeEventListener('dragover', preventStrayFileDrop)
  window.removeEventListener('drop', preventStrayFileDrop)
})

/* —————— 封面 —————— */

function updateCoverBlob(blob: Blob | null)
{
  if (submitting.value) return

  coverBlob.value = blob
}

/* —————— 分区：同一时间只展开一个下拉 —————— */

type CategoryMenu = 'parent' | 'child'

const openCategoryMenu = ref<CategoryMenu | null>(null)

function toggleCategoryMenu(menu: CategoryMenu)
{
  openCategoryMenu.value = openCategoryMenu.value === menu ? null : menu
}

function onPickParentCategory(value: string)
{
  selectParentCategory(value)
  // 有二级分区就直接展开，方便接着选
  const parent = categoryOptions.value.find(option => option.value === value)
  openCategoryMenu.value = parent && parent.children.length > 0 ? 'child' : null
}

function onPickChildCategory(value: string)
{
  selectChildCategory(value)
  openCategoryMenu.value = null
}

watch(submitting, (locked) =>
{
  if (locked) openCategoryMenu.value = null
})

/* —————— 简介：\n 按 2 个字符计，超出部分实时截掉 —————— */

function truncateIntroduction(text: string): string
{
  let count = 0
  for (let i = 0; i < text.length; i++)
  {
    count += text[i] === '\n' ? 2 : 1
    if (count > MAX_INTRODUCTION_LENGTH) return text.slice(0, i)
  }
  return text
}

function onIntroductionInput(event: Event)
{
  if (submitting.value) return

  const textarea = event.target as HTMLTextAreaElement
  const text = truncateIntroduction(textarea.value)
  if (text !== textarea.value) textarea.value = text
  form.introduction = text
}

/* —————— 提交 —————— */

const submitLabel = computed(() =>
{
  if (submitting.value) return isUploadingFiles.value ? `上传中 ${uploadPercent.value}%` : '提交中…'
  return isEditMode.value ? '提交修改' : '提交视频'
})

type HintTone = 'muted' | 'danger' | 'ready'

/** 提交按钮旁的提示，同一时间只显示一条 */
const submitHint = computed<{ text: string, tone: HintTone }>(() =>
{
  if (submitting.value)
  {
    return { text: isUploadingFiles.value ? '正在上传，请不要关闭页面' : '正在提交，请不要关闭页面', tone: 'muted' }
  }
  if (hasExceededVideoEpisodes.value)
  {
    return { text: `单个视频最多只能提交 ${maxVideoEpisodes.value} 个分P`, tone: 'danger' }
  }
  if (videoQuota.value.over) return { text: '视频总大小超出今日剩余额度', tone: 'danger' }
  if (imageQuota.value.over) return { text: '封面超出今日图片额度', tone: 'danger' }
  if (hasMissingExistingFileId.value) return { text: '存在旧分P数据损坏，请尝试删除旧分P', tone: 'danger' }
  if (activePreuploadList.value.length === 0)
  {
    const text = failedTransferList.value.length > 0 ? '请重新上传视频文件以替换转码失败的分P' : '请选择视频文件后再提交'
    return { text, tone: 'muted' }
  }
  if (missingFields.value.length > 0) return { text: `还需完善：${missingFields.value.join('、')}`, tone: 'muted' }
  if (introductionCharCount.value > MAX_INTRODUCTION_LENGTH)
  {
    return { text: `简介不能超过 ${MAX_INTRODUCTION_LENGTH} 个字符`, tone: 'danger' }
  }
  return { text: '信息已完善，可以提交', tone: 'ready' }
})

function onSubmit()
{
  openCategoryMenu.value = null
  submitVideo()
}

/** 编辑模式：取消编辑回到稿件管理（离开页面前会确认） */
function cancelEdit()
{
  router.push('/cc/video')
}

function goToWorks()
{
  router.push({ path: '/cc/video', query: { status: 'ing' } })
}
</script>

<template>
  <div class="cc-page">
    <CcPageHeader :title="isEditMode ? '编辑稿件' : '投稿'" />

    <UploadQuotaPanel :video="videoQuota" :image="imageQuota" :loading="quotaLoading" />

    <input ref="fileInputRef" class="file-input" type="file" multiple :accept="VIDEO_ACCEPT" tabindex="-1"
      aria-hidden="true" @change="onFileInputChange">

    <!-- 提交成功 -->
    <UploadSuccess v-if="submitState" :title="form.videoTitle" :edit="isEditMode" @view-works="goToWorks"
      @continue-upload="continueUpload" />

    <!-- 还没选文件：拖拽上传区 -->
    <VideoDropZone v-else-if="!showForm" :disabled="submitting" @pick="openFilePicker"
      @drop-files="addVideoFiles" />

    <template v-else>
      <!-- 视频分P -->
      <VideoPartList v-model="activePreuploadList" :failed-list="failedTransferList" :locked="submitting"
        @pick="openFilePicker" @remove="removeItem" />

      <!-- 视频信息 -->
      <section class="info-panel">
        <h2 class="panel-title">视频信息</h2>

        <div class="form-row">
          <span class="form-label cover-label">封面 <span class="required" aria-hidden="true">*</span></span>
          <CoverUpload :key="formResetKey" :initial-cover-path="form.coverPath" :disabled="submitting"
            @update:cover-blob="updateCoverBlob" @update:cover-quota-bytes="setCoverQuotaBytes" />
        </div>

        <div class="form-row">
          <label class="form-label" for="cc-upload-title">标题 <span class="required" aria-hidden="true">*</span></label>
          <span class="input-wrap">
            <input id="cc-upload-title" v-model="form.videoTitle" class="soft-input title-input"
              :maxlength="MAX_TITLE_LENGTH" placeholder="给视频起个标题" autocomplete="off" aria-required="true"
              :disabled="submitting">
            <span class="input-counter">{{ form.videoTitle.length }} / {{ MAX_TITLE_LENGTH }}</span>
          </span>
        </div>

        <div class="form-row">
          <span class="form-label type-label">类型 <span class="required" aria-hidden="true">*</span></span>
          <div class="type-field">
            <CcSegmented v-model="form.postType" :options="POST_TYPE_OPTIONS" size="sm" :disabled="submitting" />
            <input v-if="form.postType === 2" v-model="form.originInfo" class="soft-input" placeholder="请填写原资源说明"
              aria-label="原资源说明" aria-required="true" autocomplete="off" :disabled="submitting">
          </div>
        </div>

        <div class="form-row">
          <span class="form-label">标签</span>
          <VideoTag v-model:tags="tagList" :disabled="submitting" />
        </div>

        <div class="form-row">
          <span class="form-label">分区 <span class="required" aria-hidden="true">*</span></span>
          <div class="category-fields">
            <CategoryDropdown :options="categoryOptions" :model-value="selectedParentNumber" placeholder="选择一级分区"
              label="一级分区" :open="openCategoryMenu === 'parent'" :disabled="submitting"
              @toggle="toggleCategoryMenu('parent')" @close="openCategoryMenu = null" @select="onPickParentCategory" />
            <CategoryDropdown :options="childCategoryOptions" :model-value="selectedChildNumber"
              :placeholder="selectedParentNumber ? '选择二级分区' : '请先选择一级分区'" label="二级分区"
              :open="openCategoryMenu === 'child'" :disabled="submitting || !selectedParentNumber"
              @toggle="toggleCategoryMenu('child')" @close="openCategoryMenu = null" @select="onPickChildCategory" />
          </div>
          <!-- 点下拉外面收起 -->
          <div v-if="openCategoryMenu" class="dropdown-mask" @click="openCategoryMenu = null"></div>
        </div>

        <div class="form-row">
          <label class="form-label" for="cc-upload-intro">简介</label>
          <span class="input-wrap">
            <textarea id="cc-upload-intro" :value="form.introduction" class="intro-textarea"
              placeholder="介绍一下这个视频（选填）" :disabled="submitting" @input="onIntroductionInput"></textarea>
            <span class="input-counter intro-counter">{{ introductionCharCount }} / {{ MAX_INTRODUCTION_LENGTH }}</span>
          </span>
        </div>

        <div class="form-row centered">
          <span class="form-label">互动设置</span>
          <div class="toggle-group">
            <CcCheckChip v-model="closeDanmaku" label="关闭弹幕" :disabled="submitting" />
            <CcCheckChip v-model="closeComment" label="关闭评论" :disabled="submitting" />
          </div>
        </div>

        <div class="form-row centered submit-row">
          <span></span>
          <div class="submit-actions">
            <button type="button" :class="['submit-button', { busy: submitting }]" :disabled="!canSubmit"
              :aria-busy="submitting" @click="onSubmit">{{ submitLabel }}</button>
            <button v-if="isEditMode" type="button" class="back-button" :disabled="submitting" @click="cancelEdit">
              取消编辑
            </button>
            <button v-else type="button" class="back-button" :disabled="submitting" @click="returnToUploadPanel">
              返回上传界面
            </button>
            <span :class="['submit-hint', submitHint.tone]" aria-live="polite">{{ submitHint.text }}</span>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<style lang="scss" scoped>
@use '@/pages/creativeCenter/shared/styles/cc' as *;

.file-input {
  display: none;
}

.info-panel {
  @include panel(30px 32px 28px, 32px);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.panel-title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.01em;
}

/*——————表单行：左边 88px 标签列—————— */

.form-row {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 20px;
  align-items: start;

  &.centered {
    align-items: center;
  }
}

.form-label {
  padding-top: 14px;
  font-size: 14px;
  font-weight: 600;
  color: $warm-ink;

  &.cover-label {
    padding-top: 12px;
  }

  // 和 46px 高的分段选择居中对齐
  &.type-label {
    padding-top: 13px;
  }

  .centered & {
    padding-top: 0;
  }
}

.required {
  color: $warm-accent;
}

.input-wrap {
  position: relative;
  display: block;
}

.soft-input {
  @include soft-input(50px, 16px);
}

.title-input {
  padding-right: 90px;
}

.input-counter {
  position: absolute;
  top: 17px;
  right: 18px;
  @include mono(12px);
  color: $warm-ink-4;
  pointer-events: none;
}

.type-field {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.category-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.dropdown-mask {
  position: fixed;
  inset: 0;
  z-index: 8;
}

.intro-textarea {
  @include soft-input(140px, 16px);
  display: block;
  min-height: 140px;
  padding: 14px 18px 32px;
  resize: vertical;
  font-size: 14px;
  line-height: 1.7;
}

.intro-counter {
  top: auto;
  bottom: 14px;
}

.toggle-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

/*——————提交行—————— */

.submit-row {
  margin-top: 4px;
  padding-top: 24px;
  border-top: 1px solid $cc-line;
}

.submit-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.submit-button {
  @include accent-button(50px, 0 32px, 15px);
  font-weight: 700;
  box-shadow: 0 14px 30px -14px rgba(0, 0, 242, 0.7);

  &:disabled {
    background: rgba(0, 0, 242, 0.28);
    box-shadow: none;
  }

  // 上传中保持实色
  &.busy:disabled {
    background: $warm-accent;
  }
}

.back-button {
  @include soft-pill(50px, 0 24px, 14px);

  &:hover:not(:disabled) {
    background: $warm-sunken-hover;
    color: $warm-ink;
  }

  &:disabled {
    opacity: 0.4;
  }
}

.submit-hint {
  margin-left: 8px;
  font-size: 13px;
  color: $warm-ink-4;

  &.danger {
    color: $cc-danger;
    font-weight: 600;
  }

  &.ready {
    color: $warm-accent;
    font-weight: 600;
  }
}
</style>
