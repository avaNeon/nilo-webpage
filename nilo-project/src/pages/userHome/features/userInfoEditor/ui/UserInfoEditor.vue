<script lang="ts" setup>
import { onBeforeUnmount, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { UserInfoEditorApi } from '../api/UserInfoEditorApi';
import { useUserInfoEditor } from '../model/useUserInfoEditor';
import { useHostUserDetailStore } from '@/shared/store/HostUserDetailStore';
import { useSystemConfigStore } from '@/shared/store/SystemConfigStore';
import AvatarEdit from './AvatarEdit.vue';

/* ———————— 父组件通信 ———————— */
const props = defineProps<{
    visible: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'reload'): void;
}>();

const {
    formRef,
    formData,
    rules,
    avatarPreviewUrl,
    uploadProgress,
    validateAvatarFileSize,
    setPendingAvatarUpload,
    uploadPendingAvatar,
    clearPendingAvatarUpload,
} = useUserInfoEditor();

/* ———————— 数据源 ———————— */
const hostUserDetailStore = useHostUserDetailStore();
const systemConfigStore = useSystemConfigStore();

/* ———————— 头像文件选择 ———————— */
const avatarInputRef = ref<HTMLInputElement>();
const avatarEditVisible = ref(false);
const selectedAvatarUrl = ref('');

function triggerAvatarSelect()
{
    // 模拟点击隐藏的上传文件的input按钮
    avatarInputRef.value?.click();
}

async function onAvatarFileChange(e: Event)
{
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!validateAvatarFileSize(file))
    {
        input.value = '';
        return;
    }

    revokeSelectedAvatarUrl();
    selectedAvatarUrl.value = URL.createObjectURL(file);
    avatarEditVisible.value = true;
    // 重置 input，使得重复选择同一个文件也能触发 change
    input.value = '';
}

function revokeSelectedAvatarUrl()
{
    if (!selectedAvatarUrl.value) return;

    URL.revokeObjectURL(selectedAvatarUrl.value);
    selectedAvatarUrl.value = '';
}

function cancelAvatarCrop()
{
    avatarEditVisible.value = false;
    revokeSelectedAvatarUrl();
}

async function handleAvatarCrop(blob: Blob)
{
    avatarEditVisible.value = false;

    try
    {
        const file = new File([blob], 'avatar.png', { type: blob.type || 'image/png' });
        setPendingAvatarUpload(file);
    }
    finally
    {
        revokeSelectedAvatarUrl();
    }
}

/* ———————— 操作 ———————— */
const isSaving = ref(false);

async function handleSave()
{
    const valid = await formRef.value?.validate().catch(() => false);
    
    if (!valid)
    {
        return;
    }

    isSaving.value = true;

    try
    {
        const avatarUploaded = await uploadPendingAvatar();
        if (!avatarUploaded)
        {
            ElMessage.error('头像上传失败，请稍后重试');
            return;
        }

        const result = await UserInfoEditorApi.updateUserInfo({ ...formData });

        if (result !== false)
        {
            ElMessage.success('保存成功');
            emit('update:visible', false);
            emit('reload');
        }
        else
        {
            ElMessage.error('保存失败，请稍后重试');
        }
    } finally
    {
        isSaving.value = false;
    }
}

function handleCancel()
{
    clearPendingAvatarUpload();
    emit('update:visible', false);
}

/**  对话框打开时回填数据  */
watch(
    () => props.visible,
    (val) =>
    {
        if (val)
        {
            clearPendingAvatarUpload();
            const detail = hostUserDetailStore.userHostDetail;
            if (detail)
            {
                formData.nickName = detail.nickName ?? '';
                formData.avatar = detail.avatar ?? '';
                formData.gender = detail.gender ?? 2;
                formData.birthday = detail.birthday ?? '';
                formData.school = detail.school ?? '';
                formData.personalIntroduction = detail.personalIntroduction ?? '';
                formData.noticeInfo = detail.noticeInfo ?? '';
            }
            formRef.value?.clearValidate();
        }
        else
        {
            cancelAvatarCrop();
            clearPendingAvatarUpload();
        }
    },
);

onBeforeUnmount(() =>
{
    revokeSelectedAvatarUrl();
    clearPendingAvatarUpload();
});
</script>

<template>
    <AvatarEdit :model-value="avatarEditVisible" :img-src="selectedAvatarUrl" @crop="handleAvatarCrop"
        @cancel="cancelAvatarCrop" />

    <el-dialog :model-value="visible" title="编辑个人信息" width="520px" :close-on-click-modal="false"
        @update:model-value="emit('update:visible', $event)">
        <el-form ref="formRef" :model="formData" :rules="rules" label-width="90px">
            <el-form-item label="昵称" prop="nickName">
                <el-input v-model="formData.nickName" maxlength="20" show-word-limit placeholder="请输入昵称" />
                <span class="hint">修改昵称需要花费{{ systemConfigStore.modifyNickNameCost }}个硬币</span>
            </el-form-item>

            <el-form-item label="头像" prop="avatar">
                <div class="avatar-editor">
                    <img class="avatar-preview" :src="avatarPreviewUrl" alt="头像预览" />
                    <div class="avatar-upload-area">
                        <el-button class="avatar-upload-btn" :disabled="uploadProgress !== null || avatarEditVisible"
                            @click="triggerAvatarSelect">
                            {{ uploadProgress !== null ? '上传中...' : '选择图片' }}
                        </el-button>
                        <el-progress v-if="uploadProgress !== null" class="avatar-progress" :percentage="uploadProgress"
                            :stroke-width="6" />
                    </div>
                </div>
                <input ref="avatarInputRef" type="file" accept="image/*" style="display:none"
                    @change="onAvatarFileChange" />
            </el-form-item>

            <el-form-item label="性别" prop="gender">
                <el-radio-group v-model="formData.gender">
                    <el-radio :value="0">女</el-radio>
                    <el-radio :value="1">男</el-radio>
                    <el-radio :value="2">未知</el-radio>
                </el-radio-group>
            </el-form-item>

            <el-form-item label="生日" prop="birthday">
                <input type="date" class="birthday-picker" v-model="formData.birthday" />
            </el-form-item>

            <el-form-item label="学校" prop="school">
                <el-input v-model="formData.school" maxlength="150" show-word-limit placeholder="请输入学校" />
            </el-form-item>

            <el-form-item label="个人简介" prop="personalIntroduction">
                <el-input v-model="formData.personalIntroduction" type="textarea" maxlength="200" show-word-limit
                    :rows="3" placeholder="请输入个人简介" />
            </el-form-item>

            <el-form-item label="公告信息" prop="noticeInfo">
                <el-input v-model="formData.noticeInfo" type="textarea" maxlength="300" show-word-limit :rows="4"
                    placeholder="请输入公告信息" />
            </el-form-item>
        </el-form>

        <template #footer>
            <el-button @click="handleCancel">取消</el-button>
            <el-button type="primary" :loading="isSaving" @click="handleSave">保存</el-button>
        </template>
    </el-dialog>
</template>

<style lang="scss" scoped>
.avatar-editor {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;

    .avatar-preview {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        object-fit: cover;
        flex-shrink: 0;
        border: 1px solid #dcdfe6;
    }

    .avatar-upload-area {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;

        .avatar-upload-btn {
            width: 100px;
        }

        .avatar-progress {
            max-width: 200px;
        }
    }
}

.birthday-picker {
    width: 100%;
    height: 32px;
    padding: 0 11px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    font-size: 14px;
    color: #606266;
    background: #fff;
    outline: none;
    box-sizing: border-box;
    font-family: inherit;

    &:focus {
        border-color: #409eff;
    }
}

.hint {
    font-size: 12px;
    color: grey;
}
</style>
