<script lang="ts" setup>
import { computed, ref, useTemplateRef } from 'vue';

interface Props
{
    disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    disabled: false,
})

/** 标签列表：每次增删都会同步给父组件 */
const tags = defineModel<string[]>('tags', { default: () => [] })

const MAX_TAG_NUMBER = 10
/** 单个标签最多字符数 */
const MAX_TAG_LENGTH = 29

const draft = ref('')
const inputRef = useTemplateRef<HTMLInputElement>('inputRef')

const isFull = computed(() => tags.value.length >= MAX_TAG_NUMBER)

const placeholder = computed(() =>
{
    if (isFull.value) return `最多添加 ${MAX_TAG_NUMBER} 个标签`
    return tags.value.length > 0 ? '继续输入，回车添加' : `输入标签后按回车添加，最多 ${MAX_TAG_NUMBER} 个`
})

/** 把输入框里的内容加成标签（去空格、去重） */
function commitDraft()
{
    // 标签提交时用英文逗号拼接，标签里不能再带逗号
    const value = draft.value.replace(/,/g, '').trim()
    draft.value = ''
    if (props.disabled || !value || isFull.value || tags.value.includes(value)) return
    tags.value = [...tags.value, value]
}

function onKeydown(event: KeyboardEvent)
{
    // 输入法选字时的回车 / 退格不处理
    if (event.isComposing) return

    if (event.key === 'Enter')
    {
        event.preventDefault()
        commitDraft()
    }
    else if (event.key === 'Backspace' && !draft.value && tags.value.length > 0)
    {
        tags.value = tags.value.slice(0, -1)
    }
}

function removeTag(index: number)
{
    if (props.disabled) return
    tags.value = tags.value.filter((_, i) => i !== index)
}

/** 点输入框外的空白处也能开始输入 */
function focusInput(event: MouseEvent)
{
    if (event.target === event.currentTarget) inputRef.value?.focus()
}
</script>

<template>
    <div :class="['video-tag', { disabled }]" @click="focusInput">
        <span v-for="(tag, index) in tags" :key="`${index}-${tag}`" class="tag-chip">
            {{ tag }}
            <button type="button" class="tag-remove" :aria-label="`删除标签 ${tag}`" :disabled="disabled"
                @click="removeTag(index)">×</button>
        </span>
        <input ref="inputRef" v-model="draft" class="tag-input" :maxlength="MAX_TAG_LENGTH" :placeholder="placeholder"
            aria-label="标签" :disabled="disabled || isFull" @keydown="onKeydown" @blur="commitDraft">
        <span class="tag-count">{{ tags.length }} / {{ MAX_TAG_NUMBER }}</span>
    </div>
</template>

<style lang="scss" scoped>
@use '@/pages/creativeCenter/shared/styles/cc' as *;

.video-tag {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    min-height: 50px;
    padding: 7px 18px 7px 8px;
    border-radius: 16px;
    background: $warm-sunken;
    cursor: text;
    transition: background-color 0.2s, box-shadow 0.2s;

    &:focus-within {
        background: #FFFFFF;
        box-shadow: inset 0 0 0 1.5px $warm-accent;
    }

    &.disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
}

.tag-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 34px;
    padding: 0 6px 0 14px;
    border-radius: 999px;
    background: #FFFFFF;
    box-shadow: inset 0 0 0 1px rgba(11, 12, 18, 0.08);
    font-size: 13px;
    font-weight: 600;
    color: $warm-ink;
    cursor: default;
}

.tag-remove {
    @include reset-button;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    color: $warm-ink-4;
    font-size: 14px;
    transition: background-color 0.2s, color 0.2s;

    &:hover:not(:disabled) {
        background: $warm-sunken;
        color: $warm-ink;
    }
}

.tag-input {
    flex: 1;
    min-width: 160px;
    height: 36px;
    padding: 0 10px;
    border: 0;
    outline: 0;
    background: transparent;
    font: inherit;
    font-size: 14px;
    color: $warm-ink;

    &::placeholder {
        color: #8A8E9A;
    }

    &:disabled {
        cursor: not-allowed;
    }
}

.tag-count {
    @include mono(12px);
    color: $warm-ink-4;
}
</style>
