<script lang="ts" setup>
withDefaults(defineProps<{
    placeholder?: string,
}>(), {
    placeholder: '搜索视频名称',
})

const keyword = defineModel<string>({ default: '' })

const emit = defineEmits<{
    /** 回车或点放大镜 */
    (e: 'search', keyword: string): void,
}>()

function submit()
{
    emit('search', keyword.value.trim())
}
</script>

<template>
    <!-- 标题行右边的白色搜索胶囊 -->
    <label class="cc-search-pill">
        <button type="button" class="search-icon" aria-label="搜索" @click="submit">
            <span class="ring"></span>
            <span class="handle"></span>
        </button>
        <input v-model="keyword" class="search-input" type="search" :placeholder="placeholder" autocomplete="off"
            @keydown.enter="submit">
    </label>
</template>

<style lang="scss" scoped>
@use '@/pages/creativeCenter/shared/styles/cc' as *;

.cc-search-pill {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 320px;
    height: 46px;
    padding: 0 18px;
    border-radius: 999px;
    background: #FFFFFF;
    transition: box-shadow 0.2s;

    &:focus-within {
        box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.28);
    }
}

// 放大镜：圆环 + 斜柄
.search-icon {
    @include reset-button;
    position: relative;
    flex-shrink: 0;
    width: 13px;
    height: 13px;

    .ring {
        position: absolute;
        left: 0;
        top: 0;
        width: 9px;
        height: 9px;
        border: 1.5px solid $warm-ink-3;
        border-radius: 50%;
    }

    .handle {
        position: absolute;
        left: 8px;
        top: 9px;
        width: 5px;
        height: 1.5px;
        background: $warm-ink-3;
        transform: rotate(45deg);
    }
}

.search-input {
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

    // 去掉浏览器自带的清除按钮
    &::-webkit-search-cancel-button {
        -webkit-appearance: none;
    }
}
</style>
