<script setup lang="ts">
import Avatar from '@/shared/entities/avatar/ui/Avatar.vue';
import Dialog from '@/shared/ui/Dialog.vue';
import { CONTACT_EMAIL } from '@/shared/config/Config';
import { imgRequestUrl } from '@/shared/utils/ImgUtil';
import { Connection } from '@element-plus/icons-vue';
import { inject } from 'vue';
import { useHeaderNav } from '../model/useHeaderNav';
import SiteSearchBar from './SiteSearchBar.vue';

const mainContentMaxWidth: number = inject('mainContentMaxWidth', 0)
const mainContentMinWidth: number = inject('mainContentMinWidth', 0)

const {
    loginStateStore,
    showContactDialog,
    uncheckedMessageCount,
    uncheckedMessageCountText,
    requireLoginThen,
} = useHeaderNav()
</script>

<template>
    <header class="site-header">
        <div class="site-header-inner" :style="{
            'max-width': mainContentMaxWidth + 'px',
            'min-width': mainContentMinWidth + 'px',
        }">
            <RouterLink to="/" class="brand">
                <span class="brand-mark"><span class="brand-dot"></span></span>
                <span class="brand-name">nilo</span>
                <span class="brand-tag">VIDEO</span>
            </RouterLink>

            <nav class="nav">
                <button type="button" class="nav-item" @click="requireLoginThen('/message/1')">
                    <span class="nav-row">
                        <span class="nav-icon iconfont icon-message"></span>
                        <span class="nav-label">消息</span>
                        <span v-if="uncheckedMessageCount > 0" class="nav-badge">{{ uncheckedMessageCountText }}</span>
                    </span>
                    <span class="nav-dot"></span>
                </button>
                <button type="button" class="nav-item"
                    @click="requireLoginThen(() => `/user/${loginStateStore.userInfo!.userId}/collection`)">
                    <span class="nav-row">
                        <span class="nav-icon iconfont icon-collection"></span>
                        <span class="nav-label">收藏</span>
                    </span>
                    <span class="nav-dot"></span>
                </button>
                <button type="button" class="nav-item"
                    @click="requireLoginThen(() => `/history/${loginStateStore.userInfo!.userId}`)">
                    <span class="nav-row">
                        <span class="nav-icon iconfont icon-history"></span>
                        <span class="nav-label">历史</span>
                    </span>
                    <span class="nav-dot"></span>
                </button>
                <button type="button" class="nav-item" @click="requireLoginThen('/cc')">
                    <span class="nav-row">
                        <span class="nav-icon iconfont icon-light"></span>
                        <span class="nav-label">创作中心</span>
                    </span>
                    <span class="nav-dot"></span>
                </button>
                <button type="button" class="nav-item" @click="showContactDialog = true">
                    <span class="nav-row">
                        <el-icon class="nav-icon" :size="16">
                            <Connection />
                        </el-icon>
                        <span class="nav-label">联系</span>
                    </span>
                    <span class="nav-dot"></span>
                </button>
            </nav>

            <div class="spacer"></div>

            <SiteSearchBar />

            <div class="actions">
                <button type="button" class="upload-button" @click="requireLoginThen('/cc/upload')">
                    <span class="upload-plus">+</span>投稿
                </button>
                <div class="avatar-slot">
                    <Avatar :src="loginStateStore.userInfo ? imgRequestUrl(loginStateStore.userInfo.avatar, true) : ''"
                        :user-id="loginStateStore.userInfo ? loginStateStore.userInfo.userId : null" :lazy="false"
                        :width="40">
                    </Avatar>
                </div>
            </div>
        </div>

        <!-- 顶栏有 backdrop-filter，会成为 fixed 元素的定位容器，弹窗需挂到 body -->
        <Teleport to="body">
            <Dialog :show="showContactDialog" title="联系方式" :width="420" :top="160" :show-cancel="false"
                :handle-close="() => { showContactDialog = false }">
                <p class="contact-email">邮箱：{{ CONTACT_EMAIL }}</p>
            </Dialog>
        </Teleport>
    </header>
</template>

<style lang="scss" scoped>
.site-header {
    position: sticky;
    top: 0;
    z-index: 600;
    width: 100%;
    background: rgba(247, 246, 243, 0.92);
    backdrop-filter: saturate(1.2) blur(12px);
    -webkit-backdrop-filter: saturate(1.2) blur(12px);
    border-bottom: 1px solid $warm-line;
    color: $warm-ink;
    -webkit-font-smoothing: antialiased;
    font-feature-settings: 'tnum';

    // 不依赖外层 .warm-theme，自带字体
    &,
    :deep(*) {
        font-family: $warm-font-sans;
    }

    .site-header-inner {
        display: flex;
        align-items: center;
        gap: 40px;
        height: $warm-header-height;
        margin: 0 auto;
        padding: 0 48px;
    }

    button {
        padding: 0;
        border: none;
        background: transparent;
        font: inherit;
        color: inherit;
        cursor: pointer;
    }

    .brand {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-shrink: 0;
        color: $warm-ink;
        text-decoration: none;
    }

    .brand-mark {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background: $warm-ink;
    }

    .brand-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: $warm-logo-dot;
    }

    .brand-name {
        font-size: 18px;
        font-weight: 600;
        letter-spacing: 0.04em;
    }

    .brand-tag {
        font-family: $warm-font-mono;
        font-size: 10px;
        letter-spacing: 0.18em;
        color: $warm-ink-4;
    }

    .nav {
        display: flex;
        gap: 28px;
        height: $warm-header-height;
        flex-shrink: 0;
    }

    .nav-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 5px;
        padding-top: 9px;
        color: $warm-ink-4;
        transition: color 0.2s;

        &:hover,
        &:focus-visible {
            color: $warm-ink;

            .nav-dot {
                background: $warm-accent;
            }
        }

        &:focus-visible {
            outline: none;
        }
    }

    .nav-row {
        display: flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
    }

    .nav-icon {
        font-size: 16px;
        line-height: 1;
    }

    .nav-label {
        font-size: 14px;
        font-weight: 500;
    }

    .nav-badge {
        min-width: 16px;
        height: 16px;
        padding: 0 5px;
        border-radius: 999px;
        background: $warm-accent;
        color: #FFFFFF;
        font-size: 10px;
        font-weight: 600;
        line-height: 16px;
        text-align: center;
    }

    .nav-dot {
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: transparent;
        transition: background 0.2s;
    }

    .spacer {
        flex: 1;
        min-width: 0;
    }

    .actions {
        display: flex;
        align-items: center;
        gap: 14px;
        flex-shrink: 0;
    }

    .upload-button {
        display: flex;
        align-items: center;
        gap: 8px;
        height: 40px;
        padding: 0 18px;
        border-radius: 12px;
        background: $warm-ink;
        color: #FFFFFF;
        font-size: 13px;
        font-weight: 500;
        transition: background 0.2s;

        &:hover {
            background: #000000;
        }
    }

    .upload-plus {
        font-size: 16px;
        font-weight: 400;
        line-height: 1;
    }

    .avatar-slot {
        display: flex;
        align-items: center;
        height: 40px;

        :deep(.onLogin > .avatar) {
            display: block;
        }

        :deep(.onLogin .image-container) {
            border-color: rgba(26, 25, 22, 0.1) !important;
        }

        // 头像在最右侧，个人面板改为右对齐，避免超出页面产生横向滚动
        :deep(.onLogin .user-panel) {
            left: auto;
            right: 0;
            transform: none;
            transform-origin: top right;
        }

        :deep(.onLogin:hover .user-panel) {
            transform: translateY(20px) scale(1.3);
        }
    }
}

.contact-email {
    margin: 0;
    font-family: $warm-font-sans;
    font-size: 15px;
    line-height: 1.6;
    color: $warm-ink;
    word-break: break-all;
}
</style>
