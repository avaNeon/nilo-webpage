<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useSystemConfigStore } from '@/shared/store/SystemConfigStore'
import { VIDEO_EXTENSIONS } from '../model/videoFileTypes'

const props = withDefaults(defineProps<{ disabled?: boolean }>(), { disabled: false })

const emit = defineEmits<{
  /** 点「选择文件」 */
  (e: 'pick'): void,
  /** 拖进来的文件（扩展名等校验交给父组件） */
  (e: 'drop-files', files: File[]): void,
}>()

const systemConfig = useSystemConfigStore()

/* —————— 拖拽高亮：进出子元素也会触发 dragenter / dragleave，用计数判断是否还在区域内 —————— */

const dragDepth = ref(0)
const dragging = computed(() => dragDepth.value > 0 && !props.disabled)

function onDragEnter()
{
  dragDepth.value++
}

function onDragLeave()
{
  dragDepth.value = Math.max(0, dragDepth.value - 1)
}

function onDragOver(event: DragEvent)
{
  if (event.dataTransfer) event.dataTransfer.dropEffect = props.disabled ? 'none' : 'copy'
}

function onDrop(event: DragEvent)
{
  dragDepth.value = 0
  if (props.disabled) return

  const files = Array.from(event.dataTransfer?.files ?? [])
  if (files.length > 0) emit('drop-files', files)
}

/* —————— 上传规则：数值都来自系统配置 —————— */

const otherFormats = VIDEO_EXTENSIONS
  .filter(extension => extension !== '.mp4')
  .map(extension => extension.slice(1).toUpperCase())
  .join('、')

const rules = computed(() =>
{
  // 配置为 0 时后端不限制单个文件大小
  const sizeLimit = systemConfig.videoFileMaxSize > 0 ? `单个文件不超过 ${systemConfig.videoFileMaxSize}MB，` : ''
  const resolution = systemConfig.maxResolutionRatio || '--'
  const frameRate = systemConfig.maxBitRate > 0 ? `${systemConfig.maxBitRate}fps` : '--'

  return [
    { title: '大小限制', text: `${sizeLimit}受每日上传额度限制；视频较长建议分P上传` },
    { title: '格式支持', text: `推荐 MP4（处理速度最快），也支持 ${otherFormats}` },
    { title: '码率限制', text: `最大分辨率 ${resolution}，最大帧数 ${frameRate}` },
    { title: '视频奖励', text: `每个审核通过的视频奖励 ${systemConfig.rewardsPreUpload} 个硬币` },
  ]
})
</script>

<template>
  <section class="drop-panel">
    <!-- 拖拽区域 -->
    <div :class="['drop-zone', { dragging }]" @dragenter.prevent="onDragEnter" @dragover.prevent="onDragOver"
      @dragleave="onDragLeave" @drop.prevent="onDrop">
      <span class="drop-icon" aria-hidden="true">↑</span>
      <span class="drop-title">将视频文件拖到这里</span>
      <span class="drop-sub">支持一次选择多个文件，每个文件为一个分P</span>
      <button type="button" class="pick-button" :disabled="disabled" @click="emit('pick')">选择文件</button>
    </div>

    <!-- 上传规则 -->
    <div class="rule-grid">
      <div v-for="rule in rules" :key="rule.title" class="rule-card">
        <span class="rule-title">{{ rule.title }}</span>
        <span class="rule-text">{{ rule.text }}</span>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
@use '@/pages/creativeCenter/shared/styles/cc' as *;

.drop-panel {
  @include panel(28px, 32px);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  height: 400px;
  border: 2px dashed rgba(0, 0, 242, 0.28);
  border-radius: 24px;
  background: #FAFAFD;
  transition: background-color 0.2s, border-color 0.2s;

  &.dragging {
    border-color: $warm-accent;
    background: $warm-accent-soft;
  }
}

.drop-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: $warm-accent;
  color: #FFFFFF;
  font-size: 32px;
  font-weight: 300;
  box-shadow: 0 16px 32px -14px rgba(0, 0, 242, 0.7);
}

.drop-title {
  margin-top: 6px;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.drop-sub {
  font-size: 13px;
  color: $warm-ink-4;
}

.pick-button {
  @include ink-button(48px, 0 30px, 14px);
  margin-top: 8px;

  &:disabled {
    opacity: 0.4;
  }
}

.rule-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.rule-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 18px;
  border-radius: 20px;
  background: $cc-soft;
}

.rule-title {
  font-size: 13px;
  font-weight: 700;
}

.rule-text {
  font-size: 12px;
  line-height: 1.6;
  color: $warm-ink-3;
  text-wrap: pretty;
}
</style>
