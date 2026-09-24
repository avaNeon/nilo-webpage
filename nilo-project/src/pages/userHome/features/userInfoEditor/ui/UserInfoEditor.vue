<script lang="ts" setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import message from '@/shared/lib/message';
import { UserInfoEditorApi } from '../api/UserInfoEditorApi';
import { useUserInfoEditor } from '../model/useUserInfoEditor';
import { useHostUserDetailStore } from '@/shared/store/HostUserDetailStore';
import { useSystemConfigStore } from '@/shared/store/SystemConfigStore';
import GlassModal from '@/pages/userHome/shared/ui/GlassModal.vue';
import AvatarEdit from './AvatarEdit.vue';

/** 各字段长度上限，和后端校验一致 */
const LIMITS = {
    nickName: 20,
    school: 150,
    personalIntroduction: 200,
    noticeInfo: 300,
} as const

const GENDERS = [
    { value: 0, label: '女' },
    { value: 1, label: '男' },
    { value: 2, label: '未知' },
]

/* ———————— 父组件通信 ———————— */
const props = defineProps<{
    visible: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'reload'): void;
}>();

const {
    formData,
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

/* ———————— 校验 ———————— */

/** 昵称改了才提示要花硬币 */
const nickNameChanged = computed(() =>
    formData.nickName.trim() !== (hostUserDetailStore.userHostDetail?.nickName ?? ''))

const canSave = computed(() => formData.nickName.trim().length > 0 && Boolean(formData.avatar))

function validate(): boolean
{
    if (!formData.nickName.trim())
    {
        message.warning('请输入昵称');
        return false;
    }
    if (!formData.avatar)
    {
        message.warning('请上传头像');
        return false;
    }
    if (formData.birthday && !/^\d{4}-\d{2}-\d{2}$/.test(formData.birthday))
    {
        message.warning('生日格式为 yyyy-MM-dd');
        return false;
    }
    return true;
}

/* ———————— 操作 ———————— */
const isSaving = ref(false);

async function handleSave()
{
    if (isSaving.value || !validate())
    {
        return;
    }

    isSaving.value = true;

    try
    {
        const avatarUploaded = await uploadPendingAvatar();
        if (!avatarUploaded)
        {
            message.error('头像上传失败，请稍后重试');
            return;
        }

        const result = await UserInfoEditorApi.updateUserInfo({ ...formData, nickName: formData.nickName.trim() });

        if (result !== false)
        {
            message.success('保存成功');
            emit('update:visible', false);
            emit('reload');
        }
        else
        {
            message.error('保存失败，请稍后重试');
        }
    } finally
    {
        isSaving.value = false;
    }
}

function handleCancel()
{
    if (isSaving.value) return;
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

    <GlassModal :visible="visible" title="编辑个人信息" :width="640" @close="handleCancel">
        <div class="form-scroll">
            <div class="form-row">
                <span class="row-label">头像 <span class="required">*</span></span>
                <div class="row-field avatar-field">
                    <img class="avatar-preview" :src="avatarPreviewUrl" alt="头像预览">
                    <div class="avatar-actions">
                        <button type="button" class="chip-button"
                            :disabled="uploadProgress !== null || avatarEditVisible" @click="triggerAvatarSelect">
                            {{ uploadProgress !== null ? `上传中 ${uploadProgress}%` : '选择图片' }}
                        </button>
                        <span class="field-hint">JPG / PNG，建议 400×400 以上</span>
                    </div>
                    <input ref="avatarInputRef" type="file" accept="image/*" hidden @change="onAvatarFileChange">
                </div>
            </div>

            <div class="form-row">
                <label class="row-label" for="user-info-nick-name">昵称 <span class="required">*</span></label>
                <div class="row-field">
                    <span class="input-wrap">
                        <input id="user-info-nick-name" v-model="formData.nickName" :maxlength="LIMITS.nickName"
                            placeholder="你的昵称" class="text-input">
                        <span class="counter">{{ formData.nickName.length }} / {{ LIMITS.nickName }}</span>
                    </span>
                    <span v-if="systemConfigStore.modifyNickNameCost > 0"
                        :class="['field-hint', 'coin-hint', { emphasized: nickNameChanged }]">
                        <span class="coin" aria-hidden="true"></span>修改昵称需要花费 {{ systemConfigStore.modifyNickNameCost }}
                        个硬币
                    </span>
                </div>
            </div>

            <div class="form-row">
                <span class="row-label">性别 <span class="required">*</span></span>
                <div class="row-field">
                    <div class="segmented" role="radiogroup" aria-label="性别">
                        <button v-for="gender in GENDERS" :key="gender.value" type="button"
                            :class="['segment', { active: formData.gender === gender.value }]" role="radio"
                            :aria-checked="formData.gender === gender.value" @click="formData.gender = gender.value">
                            <span class="segment-dot" aria-hidden="true"></span>{{ gender.label }}
                        </button>
                    </div>
                </div>
            </div>

            <div class="form-row">
                <label class="row-label" for="user-info-birthday">生日</label>
                <div class="row-field">
                    <input id="user-info-birthday" v-model="formData.birthday" type="date" class="text-input date-input">
                </div>
            </div>

            <div class="form-row">
                <label class="row-label" for="user-info-school">学校</label>
                <div class="row-field">
                    <span class="input-wrap">
                        <input id="user-info-school" v-model="formData.school" :maxlength="LIMITS.school"
                            placeholder="选填" class="text-input">
                        <span class="counter">{{ formData.school.length }} / {{ LIMITS.school }}</span>
                    </span>
                </div>
            </div>

            <div class="form-row">
                <label class="row-label" for="user-info-intro">个人简介</label>
                <div class="row-field">
                    <span class="input-wrap">
                        <textarea id="user-info-intro" v-model="formData.personalIntroduction"
                            :maxlength="LIMITS.personalIntroduction" placeholder="介绍一下自己"
                            class="text-area intro"></textarea>
                        <span class="counter bottom">
                            {{ formData.personalIntroduction.length }} / {{ LIMITS.personalIntroduction }}
                        </span>
                    </span>
                </div>
            </div>

            <div class="form-row">
                <label class="row-label" for="user-info-notice">公告</label>
                <div class="row-field">
                    <span class="input-wrap">
                        <textarea id="user-info-notice" v-model="formData.noticeInfo" :maxlength="LIMITS.noticeInfo"
                            placeholder="显示在主页右侧的公告栏" class="text-area notice"></textarea>
                        <span class="counter bottom">{{ formData.noticeInfo.length }} / {{ LIMITS.noticeInfo }}</span>
                    </span>
                </div>
            </div>
        </div>

        <div class="actions">
            <button type="button" class="plain-button" :disabled="isSaving" @click="handleCancel">取消</button>
            <button type="button" class="primary-button" :disabled="!canSave || isSaving" @click="handleSave">
                {{ isSaving ? '保存中…' : '保存' }}
            </button>
        </div>
    </GlassModal>
</template>

<style lang="scss" scoped>
@use '@/pages/userHome/shared/styles/glass' as *;

button {
    @include reset-button;
}

.form-scroll {
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex: 1;
    min-height: 0;
    margin: 0 -8px;
    padding: 4px 8px;
    overflow: auto;
}

// 左边标签右对齐，右边输入
.form-row {
    display: grid;
    grid-template-columns: 76px minmax(0, 1fr);
    align-items: start;
    gap: 16px;
}

.row-label {
    padding-top: 14px;
    text-align: right;
    font-size: 13px;
    font-weight: 600;

    .required {
        color: $warm-accent;
    }
}

.row-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
}

.field-hint {
    font-size: 12px;
    color: $warm-ink-3;
}

/*——————头像—————— */

.avatar-field {
    flex-direction: row;
    align-items: center;
    gap: 16px;
}

.avatar-preview {
    flex-shrink: 0;
    width: 76px;
    height: 76px;
    border-radius: 50%;
    object-fit: cover;
    background: linear-gradient(140deg, oklch(0.9 0.03 255), oklch(0.62 0.12 258));
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.85), 0 12px 24px -12px rgba(11, 12, 18, 0.35);
}

.avatar-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
}

.chip-button {
    @include glass-chip-button(38px);
    padding: 0 18px;
}

/*——————输入框—————— */

.input-wrap {
    position: relative;
    display: block;
}

@mixin glass-input {
    width: 100%;
    border: 0;
    border-radius: 16px;
    outline: 0;
    background: rgba(255, 255, 255, 0.72);
    box-shadow: inset 0 1px 2px rgba(11, 12, 18, 0.08), inset 0 0 0 1px rgba(11, 12, 18, 0.1);
    color: $warm-ink;
    font: inherit;
    transition: box-shadow 0.2s, background-color 0.2s;

    &::placeholder {
        color: $warm-ink-4;
    }

    &:focus {
        background: #FFFFFF;
        box-shadow: inset 0 0 0 1.5px $warm-accent;
    }
}

.text-input {
    @include glass-input;
    height: 48px;
    padding: 0 84px 0 18px;
    font-size: 15px;
}

.date-input {
    width: 220px;
    padding: 0 16px;
    font-family: $warm-font-mono;
}

.text-area {
    @include glass-input;
    display: block;
    padding: 13px 18px 30px;
    font-size: 14px;
    line-height: 1.7;
    resize: none;

    &.intro {
        height: 96px;
    }

    &.notice {
        height: 112px;
    }
}

.counter {
    position: absolute;
    right: 16px;
    top: 15px;
    font-family: $warm-font-mono;
    font-size: 12px;
    color: $warm-ink-3;
    pointer-events: none;

    &.bottom {
        top: auto;
        bottom: 12px;
    }
}

// 金色硬币
.coin-hint {
    display: flex;
    align-items: center;
    gap: 6px;
    transition: color 0.2s;

    &.emphasized {
        color: $warm-ink;
    }

    .coin {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: oklch(0.82 0.13 85);
        box-shadow: inset 0 0 0 2px oklch(0.72 0.13 75);
    }
}

/*——————性别：白雾分段—————— */

.segmented {
    align-self: flex-start;
    display: flex;
    gap: 2px;
    padding: 4px;
    border-radius: 999px;
    @include glass-chip;
}

.segment {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 38px;
    padding: 0 20px;
    border-radius: 999px;
    color: $warm-ink-2;
    font-size: 13px;
    font-weight: 500;
    transition: background-color 0.2s, color 0.2s;

    .segment-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: rgba(11, 12, 18, 0.2);
    }

    &.active {
        background: #FFFFFF;
        color: $warm-accent;
        font-weight: 700;

        .segment-dot {
            background: $warm-accent;
        }
    }
}

/*——————按钮—————— */

.actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    flex-shrink: 0;
}

.plain-button {
    display: flex;
    align-items: center;
    height: 46px;
    padding: 0 24px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.8);
    font-size: 14px;
    font-weight: 500;
    transition: background-color 0.2s;

    &:hover:not(:disabled) {
        background: #FFFFFF;
    }
}

.primary-button {
    @include accent-button;
}
</style>
