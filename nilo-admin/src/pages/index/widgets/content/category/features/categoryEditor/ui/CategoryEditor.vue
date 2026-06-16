<script lang="ts" setup>
import { watch, toRef, computed } from "vue";
import
{
    Plus,
    Upload,
} from "@element-plus/icons-vue";
import { useCategoryEditor } from "@/pages/index/widgets/content/category/features/categoryEditor/composables/useCategoryEditor";
import type { CategoryInfo } from "@/pages/index/widgets/content/category/model/CategoryInfo";

const props = defineProps<{
    visible: boolean;
    categoryTree: CategoryInfo[];
    pCategoryId: number;
    /** 待编辑的分类 ID，>0 表示修改模式，0 表示新增模式 */
    categoryId: number;
}>();

const emit = defineEmits<{
    (e: "update:visible", value: boolean): void;
    (e: "saved"): void;
}>();

const {
    form,
    rules,
    formValid,
    isEditMode,
    iconPreview,
    backgroundPreview,
    submitting,
    resetForm,
    selectIcon,
    selectBackground,
    submit,
} = useCategoryEditor(
    toRef(props, "pCategoryId"),
    toRef(props, "categoryId"),
    toRef(props, "categoryTree"),
    () => emit("saved"),
);

/** pCategoryId 为 0 是一级分类，>0 是二级分类 */
const isPrimary = computed(() => props.pCategoryId === 0);

/** 弹窗标题 */
const dialogTitle = computed(() =>
{
    if (isEditMode.value)
    {
        return isPrimary.value ? "修改一级分类" : "修改二级分类";
    }
    return isPrimary.value ? "添加一级分类" : "添加二级分类";
});

/* ————————————文件选择触发—————————— */
function triggerIconInput()
{
    (document.getElementById("icon-file-input") as HTMLInputElement)?.click();
}
function triggerBackgroundInput()
{
    (document.getElementById("background-file-input") as HTMLInputElement)?.click();
}

function onIconFileChange(e: Event)
{
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) selectIcon(file);
}
function onBackgroundFileChange(e: Event)
{
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) selectBackground(file);
}

/* ————————————提交入口—————————— */
async function handleSubmit()
{
    await submit();
    if (!submitting.value)
    {
        emit("update:visible", false);
    }
}

// 弹窗开启前重置表单（编辑模式下自动回填）
watch(() => props.visible, (val) =>
{
    if (val) resetForm();
});
</script>

<template>
    <el-dialog :model-value="visible" :title="dialogTitle" width="560px" :close-on-click-modal="false"
        @update:model-value="emit('update:visible', $event)">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" label-position="right">
            <!-- 分类编号 -->
            <el-form-item label="分类编号" prop="categoryNumber">
                <el-input v-model="form.categoryNumber" placeholder="请输入分类编号" maxlength="50" clearable />
            </el-form-item>

            <!-- 分类名称 -->
            <el-form-item label="分类名称" prop="categoryName">
                <el-input v-model="form.categoryName" placeholder="请输入分类名称" maxlength="50" clearable />
            </el-form-item>

            <!-- 父级分类 ID：只读展示 -->
            <el-form-item label="父级分类">
                <el-input :model-value="pCategoryId" disabled />
            </el-form-item>

            <!-- 图标上传 -->
            <el-form-item v-if="isPrimary" label="图标">
                <div class="upload-row">
                    <el-button :icon="Upload" size="small" @click="triggerIconInput">选择图标</el-button>
                    <input id="icon-file-input" type="file" accept="image/*" style="display: none"
                        @change="onIconFileChange" />
                    <div v-if="iconPreview" class="preview-box">
                        <img :src="iconPreview" class="preview-img preview-img--icon" />
                    </div>
                </div>
            </el-form-item>

            <!-- 背景上传 -->
            <el-form-item v-if="isPrimary" label="背景">
                <div class="upload-row">
                    <el-button :icon="Upload" size="small" @click="triggerBackgroundInput">选择背景</el-button>
                    <input id="background-file-input" type="file" accept="image/*" style="display: none"
                        @change="onBackgroundFileChange" />
                    <div v-if="backgroundPreview" class="preview-box">
                        <img :src="backgroundPreview" class="preview-img preview-img--bg" />
                    </div>
                </div>
            </el-form-item>

            <!-- 主题色 -->
            <el-form-item v-if="isPrimary" label="主题色">
                <el-color-picker v-model="form.color" color-format="hex" />
                <span class="color-value">{{ form.color || "未选择" }}</span>
            </el-form-item>
        </el-form>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="emit('update:visible', false)">取消</el-button>
                <el-button type="primary" :icon="Plus" :loading="submitting" :disabled="!formValid || submitting"
                    @click="handleSubmit">
                    {{ isEditMode ? "保存" : "添加" }}
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<style lang="scss" scoped>
@use "@/assets/scss/variables" as *;

/* ---------- 下拉选项：一级分类展示 ---------- */
.option-primary {
    display: flex;
    align-items: center;
    gap: 8px;

    &__icon {
        width: 28px;
        height: 28px;
        border-radius: 4px;
        flex-shrink: 0;
    }

    &__icon-placeholder {
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        background-color: $color-neutral-1;
        color: $color-neutral-2;
        flex-shrink: 0;
    }

    &__name {
        font-weight: 500;
        color: $color-text-primary;
    }

    &__id {
        margin-left: auto;
        font-size: 12px;
        color: $color-text-muted;
    }
}

/* ---------- 上传预览 ---------- */
.upload-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

.preview-box {
    display: inline-flex;
}

.preview-img {
    border-radius: 6px;
    object-fit: cover;
    border: 1px solid $color-border;

    &--icon {
        width: 40px;
        height: 40px;
    }

    &--bg {
        width: 100px;
        height: 50px;
    }
}

/* ---------- 颜色选择器 ---------- */
.color-value {
    margin-left: 10px;
    font-size: 13px;
    color: $color-text-muted;
    font-family: monospace;
}

/* ---------- 弹窗底部 ---------- */
.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}
</style>
