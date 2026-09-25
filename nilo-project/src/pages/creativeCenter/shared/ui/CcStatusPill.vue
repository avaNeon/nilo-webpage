<script lang="ts" setup>
defineProps<{
    /** ing 进行中（琥珀）、ok 已通过（绿）、no 未通过（红） */
    tone: 'ing' | 'ok' | 'no',
    label: string,
}>()
</script>

<template>
    <span :class="['cc-status-pill', tone]">{{ label }}</span>
</template>

<style lang="scss" scoped>
@use '@/pages/creativeCenter/shared/styles/cc' as *;

.cc-status-pill {
    display: inline-flex;
    align-items: center;
    height: 26px;
    padding: 0 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;

    &.ing {
        background: $cc-ing-soft;
        color: $cc-ing;
    }

    &.ok {
        background: $cc-ok-soft;
        color: $cc-ok;
    }

    &.no {
        background: $cc-no-soft;
        color: $cc-no;
    }
}
</style>
