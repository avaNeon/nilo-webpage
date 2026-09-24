import { computed, reactive, ref } from "vue";
import type { UpdatedUserInfo } from "../model/UpdatedUserInfo";
import { imageApi } from "@/shared/api/ImageApi";
import { imgRequestUrl } from "@/shared/utils/ImgUtil";
import defaultAvatar from "@/assets/user.svg";
import { useSystemConfigStore } from "@/shared/store/SystemConfigStore";
import message from "@/shared/lib/message";

const PENDING_AVATAR_PLACEHOLDER = "__pending_avatar__";

export function useUserInfoEditor() {
  const systemConfigStore = useSystemConfigStore();

  /* ————————表单———————— */
  const formData = reactive<UpdatedUserInfo>({
    nickName: "",
    avatar: "",
    gender: 2,
    birthday: "",
    school: "",
    personalIntroduction: "",
    noticeInfo: "",
  });

  /* ————————头像上传———————— */
  /** 上传进度百分比，null 表示未在上传中 */
  const uploadProgress = ref<number | null>(null);
  const pendingAvatarFile = ref<File | null>(null);
  const pendingAvatarUrl = ref("");
  const imageMaxSize = computed(() => {
    const mb = systemConfigStore.imageMaxSize;
    return mb > 0 ? mb * 1024 * 1024 : 10 * 1024 * 1024;
  });

  /** 头像预览的完整请求 URL */
  const avatarPreviewUrl = computed(() => {
    if (pendingAvatarUrl.value) {
      return pendingAvatarUrl.value;
    }
    if (formData.avatar) {
      if (formData.avatar === PENDING_AVATAR_PLACEHOLDER) {
        return defaultAvatar;
      }
      return imgRequestUrl(formData.avatar, true);
    }
    return defaultAvatar;
  });

  function clearPendingAvatarUpload() {
    if (pendingAvatarUrl.value) {
      URL.revokeObjectURL(pendingAvatarUrl.value);
    }
    pendingAvatarFile.value = null;
    pendingAvatarUrl.value = "";
  }

  function validateAvatarFileSize(file: File): boolean {
    if (file.size <= imageMaxSize.value) {
      return true;
    }

    const mb = (imageMaxSize.value / (1024 * 1024)).toFixed(1);
    message.error(`"${file.name}" 超过大小限制（${mb}MB）`);
    return false;
  }

  function setPendingAvatarUpload(file: File): boolean {
    if (!validateAvatarFileSize(file)) {
      return false;
    }

    clearPendingAvatarUpload();
    pendingAvatarFile.value = file;
    pendingAvatarUrl.value = URL.createObjectURL(file);
    formData.avatar = PENDING_AVATAR_PLACEHOLDER;
    return true;
  }

  async function uploadPendingAvatar(): Promise<boolean> {
    // formData.avatar 不是占位符，说明没有待上传的头像，或者已经上传成功过（避免重复上传同一文件）
    if (formData.avatar !== PENDING_AVATAR_PLACEHOLDER) {
      return true;
    }
    if (!pendingAvatarFile.value) {
      return true;
    }

    uploadProgress.value = 0;
    try {
      const path = await imageApi.uploadImage(
        pendingAvatarFile.value,
        event => {
          if (event.total) {
            uploadProgress.value = Math.round(
              (event.loaded / event.total) * 100,
            );
          }
        },
      );
      if (path) {
        formData.avatar = path;
        // 此处不清理本地预览 URL：保存流程（updateUserInfo）尚未完成，
        // 继续用本地 blob 预览即可，避免额外的网络请求。
        // 待整个保存流程结束（成功关闭对话框 / 取消）时统一清理。
            return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      uploadProgress.value = null;
    }
  }

  return {
    formData,
    /** 头像预览完整 URL */
    avatarPreviewUrl,
    /** 头像上传进度百分比，null 表示未在上传中 */
    uploadProgress,
    /** 校验头像文件大小 */
    validateAvatarFileSize,
    /** 暂存待保存时上传的头像文件 */
    setPendingAvatarUpload,
    /** 保存前上传暂存头像 */
    uploadPendingAvatar,
    /** 清理暂存头像 */
    clearPendingAvatarUpload,
  };
}
