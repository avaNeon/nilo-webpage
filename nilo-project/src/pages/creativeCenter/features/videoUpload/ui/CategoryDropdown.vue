<script lang="ts" setup>
import { computed } from 'vue'
import type { CategoryOption } from '../model/useCategoryTag'

const props = withDefaults(defineProps<{
  options: CategoryOption[],
  /** 选中的分区编号；空串表示没选（二级分区里对应「不指定二级分类」） */
  modelValue: string,
  placeholder: string,
  /** 读屏用的字段名，如「一级分区」 */
  label: string,
  /** 展开状态由父组件控制：同一时间只展开一个，选完一级自动展开二级 */
  open: boolean,
  disabled?: boolean,
}>(), {
  disabled: false,
})

const emit = defineEmits<{
  (e: 'toggle'): void,
  (e: 'close'): void,
  (e: 'select', value: string): void,
}>()

const selected = computed(() =>
  props.modelValue ? props.options.find(option => option.value === props.modelValue) ?? null : null,
)
</script>

<template>
  <div class="category-dropdown" @keydown.esc="emit('close')">
    <button type="button" :class="['dropdown-field', { open, chosen: selected !== null }]" :disabled="disabled"
      aria-haspopup="listbox" :aria-expanded="open" :aria-label="`${label}：${selected?.label ?? placeholder}`"
      @click="emit('toggle')">
      <span class="field-text">{{ selected?.label ?? placeholder }}</span>
      <span class="field-caret" aria-hidden="true">▾</span>
    </button>

    <div v-if="open" class="dropdown-menu" role="listbox" :aria-label="label">
      <button v-for="option in options" :key="option.value" type="button" role="option"
        :aria-selected="option.value === modelValue"
        :class="['dropdown-option', { active: option.value === modelValue }]" @click="emit('select', option.value)">
        <span class="option-label">{{ option.label }}</span>
        <span class="option-mark" aria-hidden="true">{{ option.value === modelValue ? '✓' : '' }}</span>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/pages/creativeCenter/shared/styles/cc' as *;

.category-dropdown {
  position: relative;
  min-width: 0;
}

.dropdown-field {
  @include reset-button;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  height: 50px;
  padding: 0 18px;
  border-radius: 16px;
  background: $warm-sunken;
  color: $warm-ink-4;
  font-size: 15px;
  font-weight: 400;
  text-align: left;
  transition: background-color 0.2s, box-shadow 0.2s;

  &.chosen {
    color: $warm-ink;
    font-weight: 600;
  }

  &.open {
    background: #FFFFFF;
    box-shadow: inset 0 0 0 1.5px $warm-accent;
  }

  &:disabled {
    background: #F7F8FA;
    color: $warm-ink-5;
  }
}

.field-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.field-caret {
  flex-shrink: 0;
  font-size: 12px;
  color: $warm-ink-4;
  transition: transform 0.2s;

  .open & {
    transform: rotate(180deg);
  }
}

.dropdown-menu {
  position: absolute;
  top: 58px;
  right: 0;
  left: 0;
  z-index: 12;
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 336px;
  overflow-y: auto;
  padding: 6px;
  border-radius: 20px;
  background: #FFFFFF;
  box-shadow: 0 0 0 1px rgba(11, 12, 18, 0.06), 0 28px 56px -22px rgba(11, 12, 18, 0.4);
}

.dropdown-option {
  @include reset-button;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 42px;
  padding: 0 14px;
  border-radius: 14px;
  color: $warm-ink;
  font-size: 14px;
  font-weight: 500;
  text-align: left;
  transition: background-color 0.15s;

  &:hover {
    background: $warm-sunken;
  }

  &.active {
    background: $warm-accent-soft;
    color: $warm-accent;
    font-weight: 700;

    &:hover {
      background: $warm-sunken;
    }
  }

  &:focus-visible {
    outline-offset: -2px;
  }
}

.option-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.option-mark {
  flex-shrink: 0;
  font-size: 12px;
}
</style>
