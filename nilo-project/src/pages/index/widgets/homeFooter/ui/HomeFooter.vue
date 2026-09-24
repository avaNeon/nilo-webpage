<script setup lang="ts">
import { CONTACT_EMAIL } from '@/shared/config/Config'
import { inject } from 'vue'

withDefaults(defineProps<{
    /** 顶部画一条分隔线（上方不是色块时用） */
    divider?: boolean,
}>(), {
    divider: false,
})

const mainContentMaxWidth: number = inject('mainContentMaxWidth', 0)
const mainContentMinWidth: number = inject('mainContentMinWidth', 0)

const currentYear = new Date().getFullYear()
</script>

<template>
    <footer :class="['home-footer', { divider }]">
        <div class="footer-inner" :style="{
            'max-width': mainContentMaxWidth + 'px',
            'min-width': mainContentMinWidth + 'px',
        }">
            <div class="footer-brand">
                <span class="brand-mark"></span>
                <span class="brand-name">nilo 视频</span>
                <span>© {{ currentYear }}</span>
            </div>
            <nav class="footer-links">
                <RouterLink to="/cc" target="_blank">创作中心</RouterLink>
                <RouterLink to="/popular" target="_blank">24小时热榜</RouterLink>
                <a :href="`mailto:${CONTACT_EMAIL}`">联系我们</a>
            </nav>
        </div>
    </footer>
</template>

<style lang="scss" scoped>
.home-footer {
    width: 100%;

    &.divider {
        border-top: 1px solid $warm-line-soft;
    }
}

.footer-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    margin: 0 auto;
    padding: 40px 48px 44px;
    font-size: 12px;
    color: $warm-ink-4;
}

.footer-brand {
    display: flex;
    align-items: center;
    gap: 10px;
}

// 蓝色圆 + 偏右上的白点，与顶栏 logo 一致
.brand-mark {
    position: relative;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: $warm-accent;

    &::after {
        content: '';
        position: absolute;
        left: 10px;
        top: 4px;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: #FFFFFF;
    }
}

.brand-name {
    font-weight: 700;
    color: $warm-ink;
}

.footer-links {
    display: flex;
    gap: 28px;

    a {
        color: $warm-ink-4;
        text-decoration: none;
        transition: color 0.2s;

        &:hover {
            color: $warm-accent;
        }
    }
}
</style>
