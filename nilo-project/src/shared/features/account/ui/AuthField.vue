<script lang="ts" setup>
import { useTemplateRef } from 'vue'

type AuthIcon = 'email' | 'lock' | 'shield' | 'code' | 'user' | 'check'

defineOptions({ inheritAttrs: false })

defineProps<{
    icon: AuthIcon
    error?: string
    /** 右侧放了按钮（显示/隐藏），右边距收窄一点 */
    compactEnd?: boolean
    /** 图标显示成已通过（确认密码一致） */
    ok?: boolean
}>()

const model = defineModel<string>({ default: '' })
const emit = defineEmits<{
    (e: 'focus'): void
    (e: 'blur'): void
}>()

const inputRef = useTemplateRef<HTMLInputElement>('inputRef')
defineExpose({ focus: () => inputRef.value?.focus() })
</script>

<template>
    <div class="auth-field">
        <div :class="['row', { 'has-side': $slots.side }]">
            <label :class="['pill', { 'is-error': error, 'is-ok': ok, 'compact-end': compactEnd }]">
                <svg class="icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"
                    stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <template v-if="icon === 'email'">
                        <rect x="1.8" y="3.2" width="12.4" height="9.6" rx="2" />
                        <path d="M2.5 4.6 8 8.6l5.5-4" />
                    </template>
                    <template v-else-if="icon === 'lock'">
                        <rect x="2.8" y="7" width="10.4" height="7" rx="2" />
                        <path d="M5.2 7V5a2.8 2.8 0 0 1 5.6 0v2" />
                    </template>
                    <template v-else-if="icon === 'shield'">
                        <path d="M8 1.8 13 3.6v4c0 3-2.2 5.3-5 6.6-2.8-1.3-5-3.6-5-6.6v-4z" />
                        <path d="m5.8 8 1.6 1.6 3-3" />
                    </template>
                    <template v-else-if="icon === 'code'">
                        <path d="M6 2.5 5 13.5M11.5 2.5l-1 11M2.5 6h11M2 10.5h11" />
                    </template>
                    <template v-else-if="icon === 'user'">
                        <circle cx="8" cy="5.4" r="2.8" />
                        <path d="M2.6 14c.6-2.8 2.8-4.4 5.4-4.4s4.8 1.6 5.4 4.4" />
                    </template>
                    <template v-else>
                        <circle cx="8" cy="8" r="6.2" />
                        <path d="m5.4 8.2 1.8 1.8 3.4-3.6" />
                    </template>
                </svg>
                <input ref="inputRef" v-bind="$attrs" v-model="model" :aria-invalid="error ? 'true' : undefined"
                    @focus="emit('focus')" @blur="emit('blur')" />
                <slot name="suffix" />
            </label>
            <slot name="side" />
        </div>
        <span v-if="error" class="error" role="alert">{{ error }}</span>
        <slot name="hint" />
    </div>
</template>

<style lang="scss" scoped>
$danger: oklch(0.55 0.2 25);

.auth-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.row {
    display: block;

    &.has-side {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 132px;
        gap: 10px;
    }
}

.pill {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 50px;
    padding: 0 20px;
    border-radius: 999px;
    background: $warm-sunken;
    box-shadow: inset 0 0 0 1px rgba(11, 12, 18, 0);
    // 图标颜色跟着这里走：默认灰，聚焦蓝，出错红
    color: #8A8E9A;
    cursor: text;
    transition: background 0.15s, box-shadow 0.15s;

    &.compact-end {
        padding-right: 10px;
    }

    &:focus-within {
        background: #FFFFFF;
        box-shadow: inset 0 0 0 2px $warm-accent;
        color: $warm-accent;
    }

    &.is-ok {
        color: $warm-accent;
    }

    &.is-error,
    &.is-error:focus-within {
        background: #FFFFFF;
        box-shadow: inset 0 0 0 1.5px $danger;
        color: $danger;
    }
}

.icon {
    flex-shrink: 0;
    transition: color 0.2s;
}

input {
    flex: 1;
    min-width: 0;
    height: 100%;
    padding: 0;
    border: 0;
    outline: 0;
    background: transparent;
    font: inherit;
    font-size: 14px;
    color: $warm-ink;

    &::placeholder {
        color: #8A8E9A;
    }

    // 浏览器自动填充会给输入框涂底色，把它拖到看不见，胶囊自己的底色才是准的
    &:-webkit-autofill {
        -webkit-text-fill-color: $warm-ink;
        transition: background-color 600000s 0s;
    }
}

.error {
    padding-left: 20px;
    font-size: 12px;
    line-height: 1.5;
    color: $danger;
}
</style>
