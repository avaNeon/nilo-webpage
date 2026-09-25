<script lang="ts" setup>
import { computed } from 'vue'
import type { QuotaUsage } from '../model/useUploadQuota'

const props = defineProps<{
  video: QuotaUsage,
  image: QuotaUsage,
  /** 首次加载额度中 */
  loading: boolean,
}>()

interface QuotaView
{
  key: string,
  label: string,
  value: string,
  usedPercent: number,
  pendingPercent: number,
  over: boolean,
  note: string,
  pct: string,
}

function formatMiB(value: number): string
{
  return value.toFixed(2)
}

/** 实色 = 今日已用，浅色 = 本次投稿待占用（超出额度时变红） */
function buildView(key: string, label: string, pendingLabel: string, usage: QuotaUsage): QuotaView
{
  const { usedMiB, remainingMiB, pendingMiB, limitMiB, over } = usage
  const hasLimit = limitMiB > 0
  const used = usedMiB ?? 0
  const usedPercent = hasLimit ? Math.min(100, used / limitMiB * 100) : 0
  const pendingPercent = hasLimit ? Math.min(100 - usedPercent, pendingMiB / limitMiB * 100) : 0

  let note: string
  if (over) note = '已超出今日剩余额度'
  else if (pendingMiB > 0) note = `${pendingLabel} ${formatMiB(pendingMiB)} MiB`
  else if (remainingMiB === null) note = props.loading ? '正在获取今日额度' : '今日额度获取失败'
  else note = `今日剩余 ${formatMiB(remainingMiB)} MiB`

  return {
    key,
    label,
    value: `${usedMiB === null ? '--' : formatMiB(used)} / ${formatMiB(limitMiB)} MiB`,
    usedPercent,
    pendingPercent,
    over,
    note,
    pct: usedMiB === null || !hasLimit ? '--' : `${Math.round(usedPercent)}%`,
  }
}

const quotas = computed(() => [
  buildView('video', '今日视频上传额度', '本次投稿将占用', props.video),
  buildView('image', '今日图片上传额度', '封面将占用', props.image),
])
</script>

<template>
  <!-- 今日上传额度：视频 / 图片 -->
  <section class="quota-panel" aria-label="今日上传额度">
    <div v-for="quota in quotas" :key="quota.key" class="quota-item">
      <div class="quota-head">
        <span class="quota-label">{{ quota.label }}</span>
        <span class="quota-value">{{ quota.value }}</span>
      </div>
      <div class="quota-bar" role="progressbar" :aria-label="quota.label" aria-valuemin="0" aria-valuemax="100"
        :aria-valuenow="Math.round(quota.usedPercent)">
        <span class="bar-used" :style="{ width: `${quota.usedPercent}%` }"></span>
        <span :class="['bar-pending', { over: quota.over }]" :style="{ width: `${quota.pendingPercent}%` }"></span>
      </div>
      <div class="quota-foot">
        <span :class="['quota-note', { over: quota.over }]">{{ quota.note }}</span>
        <span class="quota-pct">{{ quota.pct }}</span>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
@use '@/pages/creativeCenter/shared/styles/cc' as *;

.quota-panel {
  @include panel(22px 28px, 28px);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 40px;
}

.quota-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.quota-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.quota-label {
  font-size: 14px;
  font-weight: 700;
}

.quota-value {
  @include mono(12px);
  color: $warm-ink-3;
  white-space: nowrap;
}

.quota-bar {
  display: flex;
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #F0F1F5;
}

.bar-used {
  height: 100%;
  background: $warm-accent;
  transition: width 0.15s;
}

.bar-pending {
  height: 100%;
  background: rgba(0, 0, 242, 0.28);

  &.over {
    background: oklch(0.63 0.2 25);
  }
}

.quota-foot {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
}

.quota-note {
  color: $warm-ink-3;

  &.over {
    color: $cc-danger;
    font-weight: 700;
  }
}

.quota-pct {
  font-family: $warm-font-mono;
  color: $warm-ink-3;
}
</style>
