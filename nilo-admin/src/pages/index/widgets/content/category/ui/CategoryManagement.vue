<script lang="ts" setup>
import
{
    PictureFilled, WarnTriangleFilled, Edit, Delete, FolderOpened, Folder, Plus, Operation,
} from "@element-plus/icons-vue";
import draggable from "vuedraggable";
import { useCategoryManagement, primaryCategoryColumns, secondaryCategoryColumns } from
    "@/pages/index/widgets/content/category/composables/useCategoryManagement";
import { imgRequestUrl } from "@/shared/utils/ImgUtil";
import CategoryEditor from
    "@/pages/index/widgets/content/category/features/categoryEditor/ui/CategoryEditor.vue";

const {
    categoryTree,
    currentCategory,
    currentChildren,
    editorVisible,
    editorPCategoryId,
    editorCategoryId,
    sortMode,
    sortEditedList,
    sortParentId,
    selectCategory,
    openCategoryEditor,
    openSubCategoryEditor,
    loadAllCategories,
    deleteCategory,
    enterSortMode,
    cancelSort,
    confirmSort,
} = useCategoryManagement();

/** 保存完成后刷新数据并关闭弹窗 */
function onCategorySaved()
{
    loadAllCategories();
    editorVisible.value = false;
}
</script>

<template>
    <div class="category-management-container">
        <el-row :gutter="20">
            <!-- ========== 左侧：一级分类 ========== -->
            <el-col :span="14">
                <el-card class="category-card primary-card" :style="{ height: sortMode ? '100%' : '85vh' }"
                    shadow="never">
                    <template #header>
                        <div class="card-header">
                            <div class="header-left">
                                <el-icon class="header-icon">
                                    <FolderOpened />
                                </el-icon>
                                <span class="header-title">一级分类</span>
                            </div>
                            <div class="header-right">
                                <!-- ===== 排序模式按钮组 ===== -->
                                <template v-if="sortMode && sortParentId === 0">
                                    <el-button size="normal" @click="cancelSort">取消</el-button>
                                    <el-button type="primary" size="normal" @click="confirmSort">确认</el-button>
                                </template>
                                <!-- ===== 普通模式按钮组 ===== -->
                                <template v-else>
                                    <el-tag type="info" effect="plain" size="normal" class="count-tag">
                                        {{ categoryTree.length }} 项
                                    </el-tag>
                                    <el-button type="primary" :icon="Plus" size="normal" class="add-btn"
                                        @click="openCategoryEditor()">
                                        添加分类
                                    </el-button>
                                    <el-button :icon="Operation" size="normal" class="add-btn"
                                        @click="enterSortMode(categoryTree, 0)">
                                        顺序编辑
                                    </el-button>
                                </template>
                            </div>
                        </div>
                    </template>

                    <!-- ===== 排序模式：draggable 列表 ===== -->
                    <div v-if="sortMode && sortParentId === 0" class="sort-list">
                        <draggable v-model="sortEditedList" item-key="categoryId" handle=".drag-handle"
                            ghost-class="sort-ghost" :animation="200">
                            <template #item="{ element }">
                                <div class="sort-item">
                                    <div class="drag-handle">
                                        <el-icon>
                                            <Operation />
                                        </el-icon>
                                    </div>
                                    <!-- 图标 -->
                                    <div class="sort-item__icon">
                                        <el-image v-if="element.icon" :src="imgRequestUrl(element.icon ?? null, true)"
                                            fit="contain" class="table-icon">
                                            <template #error>
                                                <div class="img-fallback">
                                                    <div class="img-fallback__box">
                                                        <el-icon>
                                                            <WarnTriangleFilled />
                                                        </el-icon>
                                                    </div>
                                                </div>
                                            </template>
                                        </el-image>
                                        <div v-else class="img-fallback">
                                            <div class="img-fallback__box">
                                                <el-icon>
                                                    <PictureFilled />
                                                </el-icon>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- 背景 -->
                                    <div class="sort-item__bg">
                                        <el-image v-if="element.background"
                                            :src="imgRequestUrl(element.background ?? null)" fit="cover"
                                            class="table-background">
                                            <template #error>
                                                <div class="img-fallback">
                                                    <div class="img-fallback__box img-fallback__box--wide">
                                                        <el-icon>
                                                            <WarnTriangleFilled />
                                                        </el-icon>
                                                    </div>
                                                </div>
                                            </template>
                                        </el-image>
                                        <div v-else class="img-fallback">
                                            <div class="img-fallback__box img-fallback__box--wide">
                                                <el-icon>
                                                    <PictureFilled />
                                                </el-icon>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- 主题色 -->
                                    <div v-if="element.color" class="color-cell sort-item__color">
                                        <span class="color-swatch" :style="{ backgroundColor: element.color }"></span>
                                        <span class="color-hex">{{ element.color }}</span>
                                    </div>
                                    <span v-else class="color-none sort-item__color">未设置</span>
                                    <!-- 编号 / 名称 -->
                                    <span class="sort-item__number">{{ element.categoryNumber }}</span>
                                    <span class="sort-item__name">{{ element.categoryName }}</span>
                                </div>
                            </template>
                        </draggable>
                    </div>

                    <!-- ===== 普通模式：一级分类表格 ===== -->
                    <el-table v-else :data="categoryTree" style="width: 100%" stripe highlight-current-row border
                        size="large" @current-change="selectCategory">
                        <el-table-column v-for="col in primaryCategoryColumns" :key="col.prop"
                            :prop="col.prop === 'action' ? undefined : col.prop" :label="col.label" :width="col.width"
                            :min-width="col.minWidth" :align="col.align ?? 'left'" :fixed="col.fixed">
                            <!-- 图标列 -->
                            <template v-if="col.prop === 'icon'" #default="{ row }">
                                <el-image v-if="row.icon" :src="imgRequestUrl(row.icon ?? null)" fit="contain"
                                    class="table-icon">
                                    <template #error>
                                        <div class="img-fallback">
                                            <div class="img-fallback__box">
                                                <el-icon>
                                                    <WarnTriangleFilled />
                                                </el-icon>
                                            </div>
                                            <span class="img-fallback__text">加载失败</span>
                                        </div>
                                    </template>
                                </el-image>
                                <div v-else class="img-fallback">
                                    <div class="img-fallback__box">
                                        <el-icon>
                                            <PictureFilled />
                                        </el-icon>
                                    </div>
                                    <span class="img-fallback__text">未设置</span>
                                </div>
                            </template>
                            <!-- 背景图片列 -->
                            <template v-else-if="col.prop === 'background'" #default="{ row }">
                                <el-image v-if="row.background" :src="imgRequestUrl(row.background ?? null)" fit="cover"
                                    class="table-background">
                                    <template #error>
                                        <div class="img-fallback">
                                            <div class="img-fallback__box img-fallback__box--wide">
                                                <el-icon>
                                                    <WarnTriangleFilled />
                                                </el-icon>
                                            </div>
                                            <span class="img-fallback__text">加载失败</span>
                                        </div>
                                    </template>
                                </el-image>
                                <div v-else class="img-fallback">
                                    <div class="img-fallback__box img-fallback__box--wide">
                                        <el-icon>
                                            <PictureFilled />
                                        </el-icon>
                                    </div>
                                    <span class="img-fallback__text">未设置</span>
                                </div>
                            </template>
                            <!-- 主题色列 -->
                            <template v-else-if="col.prop === 'color'" #default="{ row }">
                                <div v-if="row.color" class="color-cell">
                                    <span class="color-swatch" :style="{ backgroundColor: row.color }"></span>
                                    <span class="color-hex">{{ row.color }}</span>
                                </div>
                                <span v-else class="color-none">未设置</span>
                            </template>
                            <!-- 操作列 -->
                            <template v-else-if="col.prop === 'action'" #default="{ row }">
                                <div class="action-group">
                                    <el-button type="primary" link size="small"
                                        @click="openCategoryEditor(row.categoryId ?? 0, row.pCategoryId)">
                                        <el-icon>
                                            <Edit />
                                        </el-icon>
                                        编辑
                                    </el-button>
                                    <el-button type="danger" link size="small" @click="deleteCategory(row)">
                                        <el-icon>
                                            <Delete />
                                        </el-icon>
                                        删除
                                    </el-button>
                                </div>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-card>
            </el-col>

            <!-- ========== 右侧：二级分类 ========== -->
            <el-col :span="10">
                <el-card class="category-card secondary-card" shadow="never">
                    <template #header>
                        <div class="card-header">
                            <div class="header-left">
                                <el-icon class="header-icon">
                                    <Folder />
                                </el-icon>
                                <span class="header-title">二级分类</span>
                            </div>
                            <div class="header-right">
                                <!-- ===== 排序模式按钮组 ===== -->
                                <template v-if="sortMode && sortParentId > 0">
                                    <el-button size="normal" @click="cancelSort">取消</el-button>
                                    <el-button type="primary" size="normal" @click="confirmSort">确认</el-button>
                                </template>
                                <!-- ===== 普通模式按钮组 ===== -->
                                <template v-else>
                                    <el-tag type="info" effect="plain" size="normal" class="count-tag">
                                        {{ currentChildren.length }} 项
                                    </el-tag>
                                    <el-button v-if="currentCategory" type="primary" :icon="Plus" size="normal"
                                        class="add-btn" @click="openSubCategoryEditor()">
                                        添加分类
                                    </el-button>
                                    <el-button v-if="currentCategory && currentChildren.length > 0" :icon="Operation"
                                        size="normal" class="add-btn"
                                        @click="enterSortMode(currentChildren, currentCategory?.categoryId ?? 0)">
                                        顺序编辑
                                    </el-button>
                                </template>
                            </div>
                        </div>
                    </template>

                    <!-- ===== 排序模式：draggable 列表 ===== -->
                    <div v-if="sortMode && sortParentId > 0" class="sort-list">
                        <draggable v-model="sortEditedList" item-key="categoryId" handle=".drag-handle"
                            ghost-class="sort-ghost" :animation="200">
                            <template #item="{ element }">
                                <div class="sort-item sort-item--secondary">
                                    <div class="drag-handle">
                                        <el-icon>
                                            <Operation />
                                        </el-icon>
                                    </div>
                                    <span class="sort-item__number">{{ element.categoryNumber }}</span>
                                    <span class="sort-item__name">{{ element.categoryName }}</span>
                                </div>
                            </template>
                        </draggable>
                    </div>

                    <!-- ===== 普通模式：二级分类表格 ===== -->
                    <el-table v-else-if="currentCategory && currentChildren.length > 0" :data="currentChildren"
                        style="width: 100%" stripe highlight-current-row border size="large">
                        <el-table-column v-for="col in secondaryCategoryColumns" :key="col.prop"
                            :prop="col.prop === 'action' ? undefined : col.prop" :label="col.label" :width="col.width"
                            :min-width="col.minWidth" :align="col.align ?? 'left'" :fixed="col.fixed">
                            <!-- 操作列：编辑 & 删除按钮 -->
                            <template v-if="col.prop === 'action'" #default="{ row }">
                                <div class="action-group">
                                    <el-button type="primary" link size="small"
                                        @click="openCategoryEditor(row.categoryId ?? 0, row.pCategoryId)">
                                        <el-icon>
                                            <Edit />
                                        </el-icon>
                                        编辑
                                    </el-button>
                                    <el-button type="danger" link size="small" @click="deleteCategory(row)">
                                        <el-icon>
                                            <Delete />
                                        </el-icon>
                                        删除
                                    </el-button>
                                </div>
                            </template>
                        </el-table-column>
                    </el-table>

                    <!-- 未选中一级分类或二级分类为空时的占位提示 -->
                    <div v-else class="secondary-empty">
                        <el-icon class="empty-icon">
                            <Folder />
                        </el-icon>
                        <span class="empty-text">{{
                            currentCategory
                                ? "该分类暂无二级分类"
                                : "请先选择左侧一级分类"
                        }}</span>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <!-- ========== 分类编辑器弹窗 ========== -->
        <CategoryEditor v-model:visible="editorVisible" :category-tree="categoryTree" :p-category-id="editorPCategoryId"
            :category-id="editorCategoryId" @saved="onCategorySaved" />
    </div>
</template>

<style lang="scss" scoped>
@use "@/assets/scss/variables" as *;

// —— 布局容器 ——
.category-management-container {
    padding: 6px;
}

// —— 卡片通用 ——
.category-card {
    border-radius: 12px;
    transition: box-shadow 0.3s ease, transform 0.25s ease;

    &:hover {
        box-shadow: 0 6px 24px $color-shadow-sm;
        transform: translateY(-1px);
    }

    :deep(.el-card__header) {
        padding: 16px 20px;
        border-bottom: 1px solid $color-border;
    }

    :deep(.el-card__body) {
        padding: 14px 16px;
    }

    // 卡片内所有按钮统一圆角
    :deep(.el-button) {
        border-radius: 8px;
        transition: all 0.2s ease;
    }

    .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 8px;

        .header-left {
            display: flex;
            align-items: center;
            gap: 10px;

            .header-icon {
                font-size: 22px;
                color: $color-bilibili-blue;
                filter: drop-shadow(0 1px 2px rgba(0, 174, 236, 0.25));
            }

            .header-title {
                font-size: 17px;
                font-weight: 700;
                color: $color-text-primary;
                letter-spacing: 0.6px;
            }
        }

        .header-right {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
        }

        .count-tag {
            border-radius: 8px;
            font-size: 14px;
            padding: 2px 10px;
            margin: 0 10px;
            line-height: 14px;
        }

        .add-btn {
            font-size: 12px;
            letter-spacing: 0.3px;
        }
    }
}

// —— 一级分类卡片 ——
.primary-card {
    border: 1px solid $color-border;

    :deep(.el-card__header) {
        background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    }
}

// —— 二级分类卡片 ——
.secondary-card {
    border: 1px solid $color-border;

    :deep(.el-card__header) {
        background: linear-gradient(135deg, #fdf6ec 0%, #fef3e2 100%);
    }
}

// —— 表格统一样式 ——
:deep(.el-table) {
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid #ebeef5;

    thead {
        th.el-table__cell {
            background-color: #f7f8fa !important;
            font-weight: 700;
            color: $color-text-primary;
            font-size: 13px;
            letter-spacing: 0.3px;
            border-bottom: 2px solid $color-border;
        }
    }

    .el-table__row {
        transition: background-color 0.2s, transform 0.15s;

        &:hover {
            background-color: #f8faff !important;
            transform: scale(1.002);
        }

        // 选中行高亮
        &.current-row {
            >td {
                background-color: #ecf5ff !important;
            }
        }
    }

    .el-table__cell {
        padding: 10px 0;
    }

    .cell {
        line-height: 1.6;
    }
}

// —— 图片展示 ——
.table-icon {
    width: 52px;
    height: 52px;
    border-radius: 8px;
    display: inline-block;
    vertical-align: middle;
    box-shadow: 0 1px 4px $color-mask-10;
}

.table-background {
    width: 100%;
    max-width: 180px;
    height: 52px;
    border-radius: 6px;
    display: inline-block;
    vertical-align: middle;
    object-fit: cover;
    box-shadow: 0 1px 4px $color-mask-10;
}

// —— 图片加载失败 / 未设置时的占位 ——
.img-fallback {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;

    &__box {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border-radius: 8px;
        background-color: $color-neutral-1;
        color: $color-neutral-2;
        font-size: 16px;
        transition: background-color 0.2s;

        &--wide {
            width: 100%;
            max-width: 180px;
            height: 38px;
            border-radius: 6px;
        }
    }

    &__text {
        font-size: 11px;
        line-height: 1;
        color: $color-text-muted;
        white-space: nowrap;
    }
}

// —— 主题色展示 ——
.color-cell {
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.color-swatch {
    display: inline-block;
    width: 22px;
    height: 22px;
    border-radius: 5px;
    border: 1px solid $color-border;
    flex-shrink: 0;
    box-shadow: 0 1px 3px $color-mask-10;
}

.color-hex {
    font-size: 12px;
    font-family: "SF Mono", "Cascadia Code", "JetBrains Mono", monospace;
    color: $color-text-secondary;
    white-space: nowrap;
}

.color-none {
    font-size: 12px;
    color: $color-text-muted;
    font-style: italic;
}

// —— 操作按钮组 ——
.action-group {
    display: flex;
    gap: 2px;
    justify-content: center;

    .el-button {
        padding: 2px 10px;
        font-size: 14px;
        border-radius: 6px;
        transition: all 0.2s ease;

        // 编辑按钮 hover 增强
        &--primary.is-link {
            &:hover {
                background-color: rgba(0, 174, 236, 0.08);
                color: darken(#00aeec, 8%);
            }
        }

        // 删除按钮 hover 增强
        &--danger.is-link {
            &:hover {
                background-color: rgba(245, 108, 108, 0.08);
                color: darken(#f56c6c, 8%);
            }
        }
    }
}

// —— 二级分类空状态 ——
.secondary-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    padding: 56px 20px;
    border-radius: 10px;
    background: linear-gradient(180deg, $color-surface 0%, #fff 100%);
    color: $color-text-muted;
    transition: background 0.3s;

    .empty-icon {
        font-size: 44px;
        color: $color-neutral-2;
        opacity: 0.6;
    }

    .empty-text {
        font-size: 14px;
        font-weight: 500;
        letter-spacing: 0.3px;
    }
}

/* ---------- 排序模式：draggable 列表 ---------- */
.sort-list {
    padding: 4px 0;

    :deep(.sort-ghost) {
        opacity: 0.3;
        background: linear-gradient(135deg, #e8f4ff 0%, #f0f9ff 100%);
        border: 2px dashed $color-bilibili-blue;
        border-radius: 10px;
    }

    :deep(.sort-chosen) {
        box-shadow: 0 6px 20px rgba(0, 174, 236, 0.2);
        border-color: $color-bilibili-blue !important;
        background: #fff;
    }
}

.sort-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 16px;
    margin-bottom: 8px;
    border: 1px solid $color-border;
    border-radius: 10px;
    background-color: #fff;
    transition: box-shadow 0.25s ease, border-color 0.25s ease, transform 0.2s ease;
    cursor: default;
    user-select: none;

    &:hover {
        box-shadow: 0 3px 12px $color-shadow-sm;
        border-color: $color-bilibili-blue-80;
        transform: translateX(4px);
    }

    .drag-handle {
        flex-shrink: 0;
        cursor: grab;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        color: $color-neutral-2;
        background-color: $color-neutral-1;
        border-radius: 6px;
        transition: background-color 0.2s, color 0.2s;

        &:hover {
            background-color: $color-bilibili-blue;
            color: #fff;
        }

        &:active {
            cursor: grabbing;
            transform: scale(0.92);
        }
    }

    &__icon {
        flex-shrink: 0;
        width: 60px;
        display: flex;
        justify-content: center;
    }

    &__bg {
        flex-shrink: 0;
        width: 120px;
    }

    &__color {
        flex-shrink: 0;
        width: 130px;
    }

    &__number {
        flex-shrink: 0;
        width: 100px;
        font-size: 13px;
        color: $color-text-secondary;
        font-family: "SF Mono", "Cascadia Code", "JetBrains Mono", monospace;
        letter-spacing: 0.3px;
    }

    &__name {
        flex: 1;
        font-size: 14px;
        font-weight: 600;
        color: $color-text-primary;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    /* 二级分类无图标/背景，简化版 */
    &--secondary {
        .sort-item__number {
            width: 140px;
        }
    }
}
</style>
