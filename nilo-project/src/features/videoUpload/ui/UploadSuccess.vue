<script lang="ts" setup>
import correctIcon from '@/assets/icon/img/correct.svg'

const emit = defineEmits<{
  'continue-upload': []
}>()

function onContinueUpload()
{
  emit('continue-upload')
}
</script>

<template>
  <div class="upload-success">
    <div class="success-content">
      <!-- 对勾图标 -->
      <img :src="correctIcon" alt="success" class="success-icon" />

      <!-- 提示文字 -->
      <p class="success-text">
        视频上传成功，请在<span class="link-text">稿件管理</span>查看进度
      </p>

      <!-- 继续上传按钮 -->
      <el-button type="primary" class="continue-btn" @click="onContinueUpload">
        继续上传
      </el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.upload-success {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.success-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  row-gap: 24px;
}

.success-icon {
  width: 80px;
  height: 80px;
}

.success-text {
  font-size: 16px;
  color: #333;
  margin: 0;

  .link-text {
    color: $color-bilibili-blue;
  }
}

.continue-btn {
  margin-top: 8px;
  min-width: 140px;
}
</style>
