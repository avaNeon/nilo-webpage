<script lang="ts" setup>
import { onBeforeUnmount, watch } from 'vue'

const props = withDefaults(defineProps<{
    visible: boolean,
    title?: string,
    width?: number,
}>(), {
    title: '',
    width: 620,
})

const emit = defineEmits<{
    (e: 'close'): void,
    (e: 'closed'): void,
}>()

/*——————Esc 关闭；里面再弹 Element 对话框（裁剪头像、确认框）时交给它们处理—————— */

function onKeydown(event: KeyboardEvent)
{
    if (event.key !== 'Escape') return
    if (document.querySelector('.el-overlay:not([style*="display: none"])')) return
    emit('close')
}

watch(() => props.visible, visible =>
{
    if (visible) window.addEventListener('keydown', onKeydown)
    else window.removeEventListener('keydown', onKeydown)
}, { immediate: true })

onBeforeUnmount(() =>
{
    window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
    <Teleport to="body">
        <Transition name="glass-modal" @after-leave="emit('closed')">
            <div v-if="visible" class="glass-modal-mask warm-theme">
                <div class="glass-modal" role="dialog" aria-modal="true" :aria-label="title"
                    :style="{ width: width + 'px' }">
                    <div class="modal-head">
                        <slot name="title">
                            <span class="modal-title">{{ title }}</span>
                        </slot>
                        <button type="button" class="close-button" aria-label="关闭" @click="emit('close')">×</button>
                    </div>
                    <slot />
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style lang="scss" scoped>
@use '@/pages/userHome/shared/styles/glass' as *;

// 比顶栏高，比 Element 的对话框（从 2000 起）低，里面再弹裁剪框、确认框时能盖住它
.glass-modal-mask {
    position: fixed;
    inset: 0;
    z-index: 1900;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(11, 12, 18, 0.22);
}

.glass-modal {
    display: flex;
    flex-direction: column;
    gap: 22px;
    max-width: 100%;
    max-height: calc(100vh - 48px);
    padding: 26px 28px 24px;
    border-radius: 36px;
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(40px) saturate(1.8);
    -webkit-backdrop-filter: blur(40px) saturate(1.8);
    box-shadow: $glass-chip-edge, 0 40px 90px -30px rgba(11, 12, 18, 0.5);
}

.modal-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-shrink: 0;
}

.modal-title {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.01em;
}

.close-button {
    @include reset-button;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.8);
    color: $warm-ink-3;
    font-size: 18px;
    transition: background-color 0.2s, color 0.2s;

    &:hover {
        background: #FFFFFF;
        color: $warm-ink;
    }
}

.glass-modal-enter-active,
.glass-modal-leave-active {
    transition: opacity 0.2s ease;

    .glass-modal {
        transition: transform 0.2s ease;
    }
}

.glass-modal-enter-from,
.glass-modal-leave-to {
    opacity: 0;

    .glass-modal {
        transform: translateY(12px) scale(0.98);
    }
}
</style>
