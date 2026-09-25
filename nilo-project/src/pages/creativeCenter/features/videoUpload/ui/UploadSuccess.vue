<script lang="ts" setup>
defineProps<{
  /** 刚提交的视频标题 */
  title: string,
  /** 编辑已有稿件 */
  edit?: boolean,
}>()

const emit = defineEmits<{
  'view-works': [],
  'continue-upload': [],
}>()
</script>

<template>
  <section class="success-panel">
    <span class="success-icon" aria-hidden="true">✓</span>
    <h2 class="success-title">{{ edit ? '修改成功' : '投稿成功' }}</h2>
    <p class="success-text">
      <template v-if="edit">「{{ title.trim() }}」的修改已提交，可以在稿件管理查看进度</template>
      <template v-else>「{{ title.trim() }}」已提交，转码完成后会进入审核</template>
    </p>
    <div class="success-actions">
      <button type="button" class="view-button" @click="emit('view-works')">查看稿件</button>
      <button type="button" class="again-button" @click="emit('continue-upload')">再投一个</button>
    </div>
  </section>
</template>

<style lang="scss" scoped>
@use '@/pages/creativeCenter/shared/styles/cc' as *;

.success-panel {
  @include panel(64px 32px, 32px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-align: center;
}

.success-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: $warm-accent;
  color: #FFFFFF;
  font-size: 32px;
  font-weight: 600;
  box-shadow: 0 16px 32px -14px rgba(0, 0, 242, 0.7);
}

.success-title {
  margin: 6px 0 0;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.015em;
}

.success-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: $warm-ink-3;
}

.success-actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.view-button {
  @include accent-button(48px, 0 26px, 14px);
}

.again-button {
  @include soft-pill(48px, 0 24px, 14px);

  &:hover:not(:disabled) {
    background: $warm-sunken-hover;
    color: $warm-ink;
  }
}
</style>
