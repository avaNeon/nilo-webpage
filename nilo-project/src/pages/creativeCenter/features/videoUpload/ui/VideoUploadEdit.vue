<script lang="ts" setup>
import { useRouter, useRoute } from 'vue-router'
import VideoUpload from './VideoUpload.vue'
import draggable from 'vuedraggable'
import { useVideoUpload } from '../model/useVideoUpload'
import { useVideoUploadConfig } from '../model/useVideoUploadConfig'
import videoIcon from '@/assets/icon/img/video.svg'
import CoverUpload from '@/pages/creativeCenter/features/coverEdit/ui/CoverUpload.vue'
import VideoTag from '@/pages/creativeCenter/entities/videoTag/ui/VideoTag.vue'
import UploadSuccess from './UploadSuccess.vue'

const router = useRouter()
const route = useRoute()

const { MAX_INTRODUCTION_LENGTH } = useVideoUploadConfig()

const {
  hasFileSelected,
  isEditMode,
  preuploadList,
  submitState,
  form,
  closeDanmaku,
  closeComment,
  readyUploadFileList,
  hasMissingExistingUploadId,
  tagList,
  isFormValid,
  submitting,
  submitVideo,
  onFileSelected,
  formatMB,
  uploadProgress,
  removeItem,
  returnToUploadPanel,
  coverBlob,
  categoryOptions,
  selectedParentNumber,
  selectedChildNumber,
  childCategoryOptions,
  onParentCategoryChange,
  onChildCategoryChange,
  introductionCharCount,
  cleanupAll,
} = useVideoUpload()

function onContinueUpload()
{
  submitState.value = false
  cleanupAll()
  router.replace({ query: { ...route.query, mode: undefined, videoId: undefined } })
}

function updateTags(tags: string[] | null | undefined)
{
  if (tags)
  {
    form.tags = tags.join(",")
  }
}

/** 简介输入框实时截断：按等效字符数（\n 计 2）限制在 MAX_INTRODUCTION_LENGTH 内 */
function onIntroductionInput()
{
  let text = form.introduction ?? ''
  let count = text.length + (text.match(/\n/g)?.length ?? 0)
  while (count > MAX_INTRODUCTION_LENGTH && text.length > 0)
  {
    text = text.slice(0, -1)
    count = text.length + ((text.match(/\n/g)?.length ?? 0))
  }
  if (text !== form.introduction)
  {
    form.introduction = text
  }
}
</script>

<template>
  <div class="content">
    <div v-if="!submitState" class="upload-panel">
      <div v-if="!hasFileSelected" class="upload-panel">
        <VideoUpload @file-selected="onFileSelected" />
      </div>

      <div v-else class="edit-panel">
        <!-- ==================== 分P管理区域 ==================== -->
        <div class="panel-header">
          <h2 class="panel-title">视频分P管理</h2>
          <span class="file-count">共 {{ preuploadList.length }} 个分P</span>
        </div>

        <draggable v-model="preuploadList" item-key="uid" class="preupload-list" handle=".drag-handle" :animation="200">
          <template #item="{ element, index }">
            <div class="preupload-item">
              <div class="item-left">
                <div class="drag-handle" title="拖拽排序">
                  <span class="drag-icon">⠿</span>
                </div>
                <div class="video-icon-wrapper">
                  <img :src="videoIcon" alt="video" class="video-icon" />
                  <span class="part-label">P{{ index + 1 }}</span>
                </div>
              </div>

              <div class="item-right">
                <el-input v-model="element.filename" placeholder="视频文件名" class="filename-input" clearable />

                <div class="progress-info">
                  <span class="progress-text">
                    {{ formatMB(element.uploadedBytes) }}MB / {{ formatMB(element.fileSize) }}MB
                  </span>
                  <span class="progress-percent">{{ uploadProgress(element) }}%</span>
                  <!-- 转码状态（仅旧文件） -->
                  <span v-if="element.isExisting && element.transferResult === 0" class="transcoding-badge">转码中</span>
                  <span v-else-if="element.isExisting && element.transferResult === 1"
                    class="transfer-done-badge">转码成功</span>
                  <span v-else-if="element.isExisting && element.transferResult === 2"
                    class="transfer-fail-badge">转码失败</span>
                  <span v-else-if="element.isExisting" class="existing-badge">原文件（未获取到状态）</span>
                  <!-- 上传状态 -->
                  <span v-if="element.status === 'error'" class="error-badge">上传失败</span>
                  <span v-else-if="element.status === 'done'" class="done-badge">已完成</span>
                  <span v-else-if="element.status === 'uploading'" class="uploading-badge">上传中</span>
                </div>

                <el-progress :percentage="uploadProgress(element)" :stroke-width="8"
                  :status="element.status === 'error' ? 'exception' : element.status === 'done' ? 'success' : undefined"
                  class="progress-bar" />
              </div>

              <div class="item-delete">
                <el-button type="danger" plain size="small" @click="removeItem(element.uid)">
                  删除文件
                </el-button>
              </div>
            </div>
          </template>
        </draggable>

        <div class="add-more-wrapper">
          <VideoUpload :fold="true" @file-selected="onFileSelected" class="add-more-upload" />
        </div>

        <!-- ==================== 视频信息表单 ==================== -->
        <div class="video-info-section">
          <h2 class="section-title">视频信息</h2>

          <!-- 封面 -->
          <div class="form-row">
            <span class="form-label"><span class="required-star">*</span>封面</span>
            <div class="form-input">
              <CoverUpload :initial-cover-path="form.coverPath" @update:cover-blob="(blob) => coverBlob = blob" />
            </div>
          </div>

          <!-- 标题 -->
          <div class="form-row">
            <span class="form-label"><span class="required-star">*</span>标题</span>
            <div class="form-input">
              <el-input v-model="form.videoTitle" placeholder="请输入视频标题（最多100个字符）" maxlength="100" show-word-limit
                clearable />
            </div>
          </div>

          <!-- 类型（自制/转载） -->
          <div class="form-row">
            <span class="form-label"><span class="required-star">*</span>类型</span>
            <div class="form-input">
              <el-radio-group v-model="form.postType">
                <el-radio :value="1">自制</el-radio>
                <el-radio :value="2">转载</el-radio>
              </el-radio-group>
              <el-input v-if="form.postType === 2" v-model="form.originInfo" placeholder="请填写原资源说明" class="origin-input"
                clearable />
            </div>
          </div>

          <!-- 标签 -->
          <div class="form-row">
            <span class="form-label">标签</span>
            <div class="form-input">
              <VideoTag :tags="tagList" @update:tags="updateTags" />
            </div>
          </div>

          <!-- 分区 -->
          <div class="form-row">
            <span class="form-label"><span class="required-star">*</span>分区</span>
            <div class="form-input category-selects">
              <el-select v-model="selectedParentNumber" placeholder="请选择一级分区" class="category-select"
                :teleported="false" @change="onParentCategoryChange">
                <el-option v-for="p in categoryOptions" :key="p.value" :label="p.label" :value="p.value" />
              </el-select>
              <el-select v-model="selectedChildNumber" placeholder="请选择二级分区" class="category-select" :teleported="false"
                :disabled="!selectedParentNumber || childCategoryOptions.length === 0" @change="onChildCategoryChange">
                <el-option v-for="c in childCategoryOptions" :key="c.value" :label="c.label" :value="c.value" />
              </el-select>
            </div>
          </div>

          <!-- 简介 -->
          <div class="form-row">
            <span class="form-label">简介</span>
            <div class="form-input">
              <el-input v-model="form.introduction" type="textarea" placeholder="请输入视频简介（最多2000个字符）" :rows="4"
                resize="vertical" @input="onIntroductionInput" />
              <span class="intro-char-count">{{ introductionCharCount }} / {{ MAX_INTRODUCTION_LENGTH }}</span>
            </div>
          </div>

          <!-- 互动设置 -->
          <div class="form-row">
            <span class="form-label">互动设置</span>
            <div class="form-input">
              <el-checkbox v-model="closeDanmaku">关闭弹幕</el-checkbox>
              <el-checkbox v-model="closeComment" style="margin-left: 24px">关闭评论</el-checkbox>
            </div>
          </div>

          <!-- 提交按钮 -->
          <div class="form-row submit-row">
            <span class="form-label"></span>
            <div class="form-input">
              <el-button type="primary" :loading="submitting" @click="submitVideo"
                :disabled="!isFormValid || readyUploadFileList.length === 0 || hasMissingExistingUploadId">
                {{ readyUploadFileList.length === 0 ? '等待视频上传完成' : isEditMode ? '提交修改' : '提交视频' }}
              </el-button>
              <el-button plain @click="returnToUploadPanel">返回上传界面</el-button>
              <span v-if="!isFormValid && readyUploadFileList.length > 0" class="submit-hint">
                请完善必填信息后再提交
              </span>
              <span v-else-if="hasMissingExistingUploadId" class="submit-hint">
                存在旧分P数据损坏，请尝试删除旧分P
              </span>
              <span v-else-if="readyUploadFileList.length === 0" class="submit-hint">
                请等待所有视频文件上传完成后再提交
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="submit-success">
      <UploadSuccess @continue-upload="onContinueUpload" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.content {
  width: 100%;
}

.edit-panel {
  max-width: 900px;
  margin: 0 auto;
  padding: 32px 24px;

  .panel-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 24px;

    .panel-title {
      font-size: 20px;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0;
    }

    .file-count {
      font-size: 14px;
      color: #999;
    }
  }
}

.submit-success {
  width: 100%;
}

// ==================== 分P列表 ====================

.preupload-list {
  display: flex;
  flex-direction: column;
  row-gap: 16px;
}

.preupload-item {
  display: flex;
  align-items: flex-start;
  column-gap: 16px;
  padding: 20px 24px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  }

  .item-left {
    display: flex;
    align-items: center;
    column-gap: 10px;
    flex-shrink: 0;

    .drag-handle {
      cursor: grab;
      color: #bbb;
      font-size: 22px;
      line-height: 1;
      user-select: none;
      padding: 4px;
      border-radius: 4px;
      transition: color 0.15s;

      &:hover {
        color: #666;
      }

      &:active {
        cursor: grabbing;
      }

      .drag-icon {
        display: block;
        letter-spacing: 2px;
      }
    }

    .video-icon-wrapper {
      position: relative;
      width: 56px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      .video-icon {
        width: 48px;
        height: 42px;
      }

      .part-label {
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        font-size: 12px;
        font-weight: 700;
        color: #fff;
        background: #834ae5;
        border-radius: 4px;
        padding: 1px 6px;
        line-height: 1.4;
        white-space: nowrap;
      }
    }
  }

  .item-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    row-gap: 10px;
    min-width: 0;

    .filename-input {
      width: 100%;
    }

    .progress-info {
      display: flex;
      align-items: center;
      column-gap: 12px;

      .progress-text {
        flex: 1;
        font-size: 13px;
        color: #666;
      }

      .progress-percent {
        font-size: 13px;
        font-weight: 600;
        color: #834ae5;
      }

      .error-badge {
        font-size: 12px;
        font-weight: 600;
        color: $color-badge-red;
        background: $color-badge-red-bg;
        padding: 2px 8px;
        border-radius: 4px;
      }

      .done-badge {
        font-size: 12px;
        font-weight: 600;
        color: $color-badge-green;
        background: $color-badge-green-bg;
        padding: 2px 8px;
        border-radius: 4px;
      }

      .existing-badge {
        font-size: 12px;
        font-weight: 600;
        color: $color-badge-orange;
        background: $color-badge-orange-bg;
        padding: 2px 8px;
        border-radius: 4px;
      }

      .transcoding-badge {
        font-size: 12px;
        font-weight: 600;
        color: $color-badge-blue;
        background: $color-badge-blue-bg;
        padding: 2px 8px;
        border-radius: 4px;
      }

      .transfer-done-badge {
        font-size: 12px;
        font-weight: 600;
        color: $color-badge-green;
        background: $color-badge-green-bg;
        padding: 2px 8px;
        border-radius: 4px;
      }

      .transfer-fail-badge {
        font-size: 12px;
        font-weight: 600;
        color: $color-badge-red;
        background: $color-badge-red-bg;
        padding: 2px 8px;
        border-radius: 4px;
      }

      .uploading-badge {
        font-size: 12px;
        font-weight: 600;
        color: $color-badge-blue;
        background: $color-badge-blue-bg;
        padding: 2px 8px;
        border-radius: 4px;
      }
    }

    .progress-bar {
      width: 100%;
    }
  }

  .item-delete {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    padding-top: 2px;
  }
}

.add-more-wrapper {
  margin-top: 24px;
  display: flex;
  justify-content: center;

  .add-more-upload {
    :deep(.content) {
      padding: 0;
    }

    :deep(.el-upload-dragger) {
      width: 100%;
      min-width: 400px;
      height: auto;
      padding: 20px 40px;
    }

    :deep(.upload-handler) {
      margin-bottom: 10px;
    }
  }
}

// ==================== 视频信息表单 ====================

.video-info-section {
  margin-top: 48px;
  padding-top: 32px;
  border-top: 1px solid #e8e8e8;

  .section-title {
    font-size: 20px;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0 0 24px;
  }
}

.form-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 24px;

  .form-label {
    flex-shrink: 0;
    width: auto;
    margin-right: 100px;
    font-size: 15px;
    font-weight: 500;
    color: #333;
    line-height: 32px;
    white-space: nowrap;

    // 红色必填星号
    .required-star {
      color: #f56c6c;
      margin-right: 2px;
      font-weight: 700;
    }
  }

  .form-input {
    flex: 1;
    min-width: 0;
  }
}

// 类型 - 转载来源输入框
.origin-input {
  margin-top: 12px;
  width: 100%;
}

// 分区下拉
.category-selects {
  display: flex;
  column-gap: 16px;

  .category-select {
    flex: 1;
    min-width: 0;
  }
}

// 提交按钮行
.submit-row {
  margin-top: 32px;

  .submit-hint {
    margin-left: 16px;
    font-size: 13px;
    color: #999;
  }
}

// 简介字符计数器
.intro-char-count {
  display: block;
  text-align: right;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style>
