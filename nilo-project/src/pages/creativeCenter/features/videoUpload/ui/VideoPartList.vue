<script lang="ts" setup>
import { computed } from 'vue'
import draggable from 'vuedraggable'
import type { PreuploadVideoFile } from '../model/PreuploadVideoFile'
import { useVideoUploadConfig } from '../model/useVideoUploadConfig'
import { FileUtil } from '@/shared/utils/FileUtil'
import { UploadUtil } from '@/shared/utils/UploadUtil'

const props = defineProps<{
  /** 转码失败的旧分P：只展示，不可编辑、不参与提交 */
  failedList: PreuploadVideoFile[],
  /** 提交中锁定 */
  locked: boolean,
}>()

const emit = defineEmits<{
  /** 继续添加文件 */
  (e: 'pick'): void,
  (e: 'remove', uid: string): void,
}>()

/** 可提交的分P，列表顺序就是分P顺序 */
const parts = defineModel<PreuploadVideoFile[]>({ required: true })

const { MAX_PART_NAME_LENGTH } = useVideoUploadConfig()

const canDrag = computed(() => !props.locked && parts.value.length > 1)

const totalBytes = computed(() => parts.value.reduce((sum, item) => sum + item.fileSize, 0))

/** 胶囊 / 进度条配色 */
type Tone = 'wait' | 'up' | 'done' | 'error' | 'ing'

interface Chip
{
  label: string,
  tone: Tone,
}

const STATUS_CHIPS: Record<PreuploadVideoFile['status'], Chip> = {
  pending: { label: '待提交', tone: 'wait' },
  uploading: { label: '上传中', tone: 'up' },
  done: { label: '已完成', tone: 'done' },
  error: { label: '上传失败', tone: 'error' },
}

function statusChip(item: PreuploadVideoFile): Chip
{
  return STATUS_CHIPS[item.status]
}

/** 编辑时旧分P的转码状态 */
function transferChip(item: PreuploadVideoFile): Chip
{
  if (item.transferResult === 0) return { label: '转码中', tone: 'ing' }
  if (item.transferResult === 1) return { label: '转码成功', tone: 'done' }
  return { label: '原文件（未获取到状态）', tone: 'wait' }
}
</script>

<template>
  <section class="parts-panel">
    <div class="panel-head">
      <div class="head-title">
        <h2 class="panel-title">视频分P</h2>
        <span class="parts-summary">共 {{ parts.length }} 个分P · 合计 {{ FileUtil.formatMB(totalBytes) }} MB</span>
      </div>
      <div class="head-actions">
        <span v-if="canDrag" class="parts-hint">拖动左侧手柄调整顺序</span>
        <button type="button" class="add-button" :disabled="locked" @click="emit('pick')">
          <span class="plus" aria-hidden="true">+</span>继续添加文件
        </button>
      </div>
    </div>

    <!-- 可拖拽排序的分P -->
    <draggable v-model="parts" item-key="uid" class="part-list" handle=".drag-handle" ghost-class="is-ghost"
      :animation="200" :disabled="!canDrag">
      <template #item="{ element, index }">
        <div class="part-row">
          <span :class="['drag-handle', { enabled: canDrag }]" title="拖拽排序" aria-hidden="true">⋮⋮</span>
          <span class="part-no">P{{ index + 1 }}</span>

          <div class="part-body">
            <span class="name-wrap">
              <input v-model="element.filename" class="name-input" :maxlength="MAX_PART_NAME_LENGTH" placeholder="分P标题"
                :aria-label="`P${index + 1} 标题`" :disabled="locked">
              <span class="name-counter">{{ element.filename.length }} / {{ MAX_PART_NAME_LENGTH }}</span>
            </span>

            <div class="progress-line">
              <span class="progress-size">
                {{ FileUtil.formatMB(element.uploadedBytes) }} MB / {{ FileUtil.formatMB(element.fileSize) }} MB
              </span>
              <span v-if="element.isExisting" :class="['status-chip', transferChip(element).tone]">
                {{ transferChip(element).label }}
              </span>
              <span :class="['status-chip', statusChip(element).tone]">{{ statusChip(element).label }}</span>
              <div class="progress-track">
                <span :class="['progress-fill', statusChip(element).tone]"
                  :style="{ width: `${UploadUtil.calcProgressPercent(element)}%` }"></span>
              </div>
              <span :class="['progress-pct', statusChip(element).tone]">
                {{ UploadUtil.calcProgressPercent(element) }}%
              </span>
            </div>
          </div>

          <button type="button" class="remove-button" :disabled="locked" @click="emit('remove', element.uid)">
            删除文件
          </button>
        </div>
      </template>
    </draggable>

    <p v-if="parts.length === 0" class="parts-empty">还没有要提交的分P，点击「继续添加文件」选择视频</p>

    <!-- 转码失败的旧分P（不可修改，提交时不会携带） -->
    <div v-if="failedList.length > 0" class="failed-section">
      <h3 class="failed-title">转码失败的文件（不可修改，提交时不会携带）</h3>
      <div v-for="item in failedList" :key="item.uid" class="part-row is-failed" aria-disabled="true">
        <span class="drag-handle" aria-hidden="true">⋮⋮</span>
        <span class="part-no failed">--</span>
        <div class="part-body">
          <span class="name-wrap">
            <input :value="item.filename" class="name-input" aria-label="转码失败的分P标题" disabled>
          </span>
          <div class="progress-line">
            <span class="progress-size">
              {{ FileUtil.formatMB(item.fileSize) }} MB / {{ FileUtil.formatMB(item.fileSize) }} MB
            </span>
            <span class="status-chip error">转码失败</span>
            <div class="progress-track">
              <span class="progress-fill error" style="width: 100%"></span>
            </div>
            <span class="progress-pct error">100%</span>
          </div>
        </div>
        <button type="button" class="remove-button" disabled>删除文件</button>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
@use 'sass:list';
@use '@/pages/creativeCenter/shared/styles/cc' as *;

.parts-panel {
  @include panel(28px, 32px);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.head-title {
  display: flex;
  align-items: baseline;
  gap: 12px;
  min-width: 0;
}

.panel-title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.parts-summary {
  font-size: 13px;
  color: $warm-ink-3;
}

.head-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 12px;
}

.parts-hint {
  font-size: 12px;
  color: $warm-ink-4;
}

.add-button {
  @include soft-pill(40px, 0 18px, 13px);

  .plus {
    font-size: 16px;
    font-weight: 400;
    line-height: 1;
  }

  &:disabled {
    opacity: 0.4;
  }
}

.part-list {
  display: flex;
  flex-direction: column;
  gap: 18px;

  &:empty {
    display: none;
  }
}

/*——————分P行—————— */

.part-row {
  display: grid;
  grid-template-columns: 18px 60px minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  padding: 16px 18px 16px 12px;
  border-radius: 22px;
  background: $cc-soft;
  transition: opacity 0.2s;

  // 拖动中留在原位的占位行
  &.is-ghost {
    opacity: 0.35;
  }

  &.is-failed {
    opacity: 0.62;
    pointer-events: none;
    user-select: none;
  }
}

.drag-handle {
  font-size: 16px;
  line-height: 1;
  letter-spacing: -2px;
  text-align: center;
  color: #8A8E9A;
  user-select: none;

  &.enabled {
    cursor: grab;

    &:active {
      cursor: grabbing;
    }
  }
}

.part-no {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 18px;
  background: $warm-accent-soft;
  color: $warm-accent;
  @include mono(15px);
  font-weight: 500;

  &.failed {
    background: $warm-sunken-hover;
    color: $warm-ink-4;
  }
}

.part-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.name-wrap {
  position: relative;
  display: block;
}

.name-input {
  width: 100%;
  height: 42px;
  padding: 0 70px 0 14px;
  border: 0;
  border-radius: 14px;
  outline: 0;
  background: #FFFFFF;
  box-shadow: inset 0 0 0 1px rgba(11, 12, 18, 0.08);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  color: $warm-ink;
  transition: box-shadow 0.2s;

  &::placeholder {
    color: #8A8E9A;
    font-weight: 400;
  }

  &:focus {
    box-shadow: inset 0 0 0 1.5px $warm-accent;
  }

  &:disabled {
    cursor: not-allowed;
  }
}

.name-counter {
  position: absolute;
  top: 13px;
  right: 14px;
  @include mono(11px);
  color: $warm-ink-4;
  pointer-events: none;
}

.progress-line {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-size {
  @include mono(12px);
  color: $warm-ink-3;
  white-space: nowrap;
}

.status-chip {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  height: 22px;
  padding: 0 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.progress-track {
  flex: 1;
  min-width: 40px;
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: #E6E8EE;
}

.progress-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  transition: width 0.1s linear;
}

.progress-pct {
  flex-shrink: 0;
  width: 40px;
  text-align: right;
  @include mono(12px);
  font-weight: 500;
}

// 状态色：胶囊底色、文字色、进度条色
$part-tones: (
  wait: ($warm-sunken-hover, $warm-ink-3, #C9CCD6),
  up: ($warm-accent-soft, $warm-accent, $warm-accent),
  done: ($cc-ok-soft, $cc-ok, oklch(0.6 0.13 155)),
  error: ($cc-danger-soft, $cc-danger, oklch(0.63 0.2 25)),
  ing: ($cc-ing-soft, $cc-ing, $cc-ing),
);

@each $tone, $colors in $part-tones {
  .status-chip.#{$tone} {
    background: list.nth($colors, 1);
    color: list.nth($colors, 2);
  }

  .progress-fill.#{$tone} {
    background: list.nth($colors, 3);
  }

  .progress-pct.#{$tone} {
    color: list.nth($colors, 2);
  }
}

.remove-button {
  @include reset-button;
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  background: #FFFFFF;
  box-shadow: inset 0 0 0 1px rgba(11, 12, 18, 0.08);
  font-size: 12px;
  font-weight: 600;
  color: $warm-ink-3;
  white-space: nowrap;
  transition: color 0.2s;

  &:hover:not(:disabled) {
    color: $cc-danger;
  }

  &:disabled {
    opacity: 0.4;
  }
}

.parts-empty {
  margin: 0;
  padding: 28px 16px;
  border-radius: 22px;
  background: $cc-soft;
  font-size: 13px;
  color: $warm-ink-4;
  text-align: center;
}

/*——————转码失败—————— */

.failed-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.failed-title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: $warm-ink-4;
}
</style>
