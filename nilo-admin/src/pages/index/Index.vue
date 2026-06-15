<script setup lang="ts">
import { useLoginStateStore } from '@/shared/store/LoginStateStore';
import { useIndex } from './composables/useIndex';


const {
    activeMenu,
    menuItems,
    defaultOpeneds,
    onMenuSelect,
} = useIndex()

const loginState = useLoginStateStore()

</script>

<template>
    <div class="index-layout">
        <el-container class="layout-container">
            <!-- 顶栏 -->
            <el-header class="layout-header">
                <div class="header-brand">
                    <span class="brand-logo">N</span>
                    <span class="brand-title">Nilo 管理界面</span>
                </div>
                <div class="header-actions">
                    <el-tag type="success" size="normal" effect="dark" round>
                        <template #default>
                            <span style="font-size: 15px; padding: 2px;">
                                {{ loginState.adminInfo?.account }}
                            </span>
                        </template>
                    </el-tag>
                </div>
            </el-header>

            <el-container class="layout-body">
                <!-- 侧边栏 -->
                <el-aside width="220px" class="layout-aside">
                    <el-menu :default-active="activeMenu" :default-openeds="defaultOpeneds" class="side-menu"
                        background-color="#001529" text-color="rgba(255, 255, 255, 0.65)" active-text-color="#ffffff"
                        @select="onMenuSelect">
                        <!-- 无子菜单的项 -->
                        <template v-for="item in menuItems" :key="item.index">
                            <el-menu-item v-if="!item.subItems" :index="item.index">
                                <el-icon>
                                    <component :is="item.icon" />
                                </el-icon>
                                <span>{{ item.label }}</span>
                            </el-menu-item>

                            <!-- 有子菜单的项 -->
                            <el-sub-menu v-else :index="item.index">
                                <template #title>
                                    <el-icon>
                                        <component :is="item.icon" />
                                    </el-icon>
                                    <span>{{ item.label }}</span>
                                </template>
                                <el-menu-item v-for="sub in item.subItems" :key="sub.index" :index="sub.index">
                                    <el-icon>
                                        <component :is="sub.icon" />
                                    </el-icon>
                                    <span>{{ sub.label }}</span>
                                </el-menu-item>
                            </el-sub-menu>
                        </template>
                    </el-menu>
                </el-aside>

                <!-- 主内容区 -->
                <el-main class="layout-main">
                    <RouterView />
                </el-main>
            </el-container>
        </el-container>
    </div>
</template>

<style lang="scss" scoped>
.index-layout {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #f0f2f5;
}

.layout-container {
    height: 100%;
    display: flex;
    flex-direction: column;
}

// ── 顶栏 ──
.layout-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 56px;
    padding: 0 24px;
    background: #001529;
    color: #fff;
    flex-shrink: 0;
    z-index: 10;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);

    .header-brand {
        display: flex;
        align-items: center;
        gap: 10px;

        .brand-logo {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 8px;
            background: linear-gradient(135deg, $color-bilibili-blue, #0095d9);
            font-size: 18px;
            font-weight: 700;
            color: #fff;
        }

        .brand-title {
            font-size: 17px;
            font-weight: 600;
            letter-spacing: 1px;
        }
    }

    .header-actions {
        display: flex;
        align-items: center;
    }
}

// ── 侧边栏 ──
.layout-aside {
    background: #001529;
    overflow: hidden;
    flex-shrink: 0;

    .side-menu {
        height: 100%;
        border-right: none;
        padding-top: 4px;
        font-weight: 500;

        .el-menu-item {
            height: 48px;
            line-height: 48px;
            margin: 2px 8px;
            border-radius: 8px;
            font-size: 15px;
            transition: all 0.2s;

            &:hover {
                background-color: rgba(255, 255, 255, 0.08);
            }

            &.is-active {
                background: linear-gradient(135deg, $color-bilibili-blue, #0095d9);
                color: #fff !important;
            }

            .el-icon {
                font-size: 18px;
                margin-right: 8px;
            }
        }

        // 子菜单
        :deep(.el-sub-menu) {
            margin: 2px 8px;

            .el-sub-menu__title {
                height: 48px;
                line-height: 48px;
                border-radius: 8px;
                font-size: 15px;
                transition: all 0.2s;

                &:hover {
                    background-color: rgba(255, 255, 255, 0.08);
                }

                .el-icon {
                    font-size: 18px;
                    margin-right: 8px;
                }
            }

            // 子菜单项
            .el-menu-item {
                margin: 2px 4px;
                padding-left: 48px !important;
                font-size: 14px;
            }

            // 展开时父级标题高亮
            &.is-opened {
                >.el-sub-menu__title {
                    color: #fff;

                    .el-icon {
                        color: $color-bilibili-blue;
                    }
                }
            }
        }
    }
}

// ── 主内容区 ──
.layout-body {
    flex: 1;
    overflow: hidden;
}

.layout-main {
    padding: 24px;
    background: #f0f2f5;
    overflow-y: auto;
}
</style>
