<script lang="ts" setup>
import { useSystemSetting } from "../composables/useSystemSetting";

const {
  formRef,
  formData,
  formRules,
  loading,
  submitting,
  handleSubmit,
  handleReset,
} = useSystemSetting();

// vue-tsc 对"从 composable 拿到的 ref 绑定同名模板 ref"识别不到用途，误报 formRef 未使用；
// 下面 <el-form ref="formRef"> 实际会由 Vue 运行时正确赋值，这里显式引用一次消除误报
void formRef;
</script>

<template>
  <div class="system-setting">
    <el-card class="setting-card" shadow="never" v-loading="loading">
      <template #header>
        <div class="page-header">
          <div class="page-title">系统配置</div>
          <div class="page-desc">管理平台全局参数，修改后立即生效</div>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-position="top"
        class="setting-form"
        @submit.prevent="handleSubmit"
      >
        <!-- 文件大小限制 -->
        <section class="form-section">
          <h3 class="section-title">文件大小限制</h3>
          <div class="form-grid">
            <el-form-item label="单个视频文件大小上限" prop="videoFileMaxSize">
              <el-input-number v-model="formData.videoFileMaxSize" :min="0" :step="10" controls-position="right" />
              <span class="field-unit">MB</span>
            </el-form-item>

            <el-form-item label="单个图片文件大小上限" prop="imageMaxSize">
              <el-input-number v-model="formData.imageMaxSize" :min="0" :step="1" controls-position="right" />
              <span class="field-unit">MB</span>
            </el-form-item>

            <el-form-item label="每日用户上传视频大小限额" prop="dailyVideoUploadSize">
              <el-input-number v-model="formData.dailyVideoUploadSize" :min="0" :step="10" controls-position="right" />
              <span class="field-unit">MB</span>
            </el-form-item>

            <el-form-item label="每日用户上传图片大小限额" prop="dailyImageUploadSize">
              <el-input-number v-model="formData.dailyImageUploadSize" :min="0" :step="5" controls-position="right" />
              <span class="field-unit">MB</span>
            </el-form-item>
          </div>
        </section>

        <!-- 视频格式限制 -->
        <section class="form-section">
          <h3 class="section-title">视频格式限制</h3>
          <div class="form-grid">
            <el-form-item label="最大分辨率支持" prop="maxResolutionRatio">
              <el-input v-model="formData.maxResolutionRatio" placeholder="例如 1920×1080" clearable />
            </el-form-item>

            <el-form-item label="最大码率支持" prop="maxBitRate">
              <el-input-number v-model="formData.maxBitRate" :min="1" :step="1" controls-position="right" />
              <span class="field-unit">fps</span>
            </el-form-item>
          </div>
        </section>

        <!-- 数量限制 -->
        <section class="form-section">
          <h3 class="section-title">数量限制</h3>
          <div class="form-grid">
            <el-form-item label="单个视频最大分P数" prop="videoMaxEpisodes">
              <el-input-number v-model="formData.videoMaxEpisodes" :min="1" :step="1" controls-position="right" />
            </el-form-item>

            <el-form-item label="最大系列视频数量" prop="maxSerieVideosNumber">
              <el-input-number v-model="formData.maxSerieVideosNumber" :min="1" :step="1" controls-position="right" />
            </el-form-item>

            <el-form-item label="最大系列数量" prop="maxSeriesNumber">
              <el-input-number v-model="formData.maxSeriesNumber" :min="1" :step="1" controls-position="right" />
            </el-form-item>
          </div>
        </section>

        <!-- 硬币奖励与消耗 -->
        <section class="form-section">
          <h3 class="section-title">硬币奖励与消耗</h3>
          <div class="form-grid">
            <el-form-item label="注册用户初始赠送硬币数" prop="registerCoin">
              <el-input-number v-model="formData.registerCoin" :min="0" :step="1" controls-position="right" />
            </el-form-item>

            <el-form-item label="每个上传的视频奖励硬币数" prop="rewardsPreUpload">
              <el-input-number v-model="formData.rewardsPreUpload" :min="0" :step="1" controls-position="right" />
            </el-form-item>

            <el-form-item label="修改昵称硬币花费" prop="modifyNickNameCost">
              <el-input-number v-model="formData.modifyNickNameCost" :min="1" :step="1" controls-position="right" />
            </el-form-item>
          </div>
        </section>
      </el-form>

      <div class="form-footer">
        <el-button size="large" @click="handleReset">重置</el-button>
        <el-button type="primary" size="large" :loading="submitting" @click="handleSubmit">
          保存配置
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.system-setting {
  padding: 16px;
}

.setting-card {
  max-width: 960px;
  margin: 0 auto;
  border-radius: 12px;

  :deep(.el-card__header) {
    padding: 20px 24px;
    border-bottom: 1px solid $color-border;
  }

  :deep(.el-card__body) {
    padding: 8px 24px 24px;
  }
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: $color-text-primary;
}

.page-desc {
  font-size: 13px;
  color: $color-text-muted;
}

.setting-form {
  padding-top: 8px;
}

.form-section {
  padding: 20px 0 8px;

  & + & {
    border-top: 1px dashed $color-border;
  }
}

.section-title {
  margin: 0 0 16px;
  padding-left: 12px;
  font-size: 15px;
  font-weight: 600;
  color: $color-text-primary;
  line-height: 1.4;
  border-left: 3px solid $color-bilibili-blue;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px 32px;
}

:deep(.el-form-item) {
  margin-bottom: 18px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: $color-text-secondary;
  padding-bottom: 6px;
}

:deep(.el-form-item__content) {
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input) {
  width: 100%;
}

.field-unit {
  flex-shrink: 0;
  font-size: 13px;
  color: $color-text-muted;
}

.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
  padding-top: 20px;
  border-top: 1px solid $color-border;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .setting-card {
    :deep(.el-card__body) {
      padding: 8px 16px 20px;
    }
  }

  .form-footer {
    flex-direction: column-reverse;

    .el-button {
      width: 100%;
      margin: 0;
    }
  }
}
</style>
