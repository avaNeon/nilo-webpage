<script setup lang="ts">
import { CONTACT_EMAIL } from '@/shared/config/Config'
import { inject } from 'vue'

const mainContentMaxWidth: number = inject('mainContentMaxWidth', 0)
const mainContentMinWidth: number = inject('mainContentMinWidth', 0)

const currentYear = new Date().getFullYear()
</script>

<template>
    <footer class="home-footer">
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
    margin-top: 96px;
    border-top: 1px solid $warm-line;
}

.footer-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    margin: 0 auto;
    // 右侧给 AI 助手悬浮球让位（right 24px + 直径 52px + 24px 间距），免得挡住「联系我们」
    padding: 28px 100px 36px 48px;
    font-size: 12px;
    color: $warm-ink-4;
}

.footer-brand {
    display: flex;
    align-items: center;
    gap: 10px;
}

.brand-mark {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: $warm-ink;
}

.brand-name {
    font-weight: 600;
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
            color: $warm-ink;
        }
    }
}
</style>
