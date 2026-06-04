import { computed, reactive, ref, useTemplateRef } from "vue";
import { type FormInstance, type FormRules } from "element-plus";
import type { UpdatedUserInfo } from "../model/UpdatedUserInfo";
import { imageApi } from "@/shared/api/ImageApi";
import { imgRequestUrl } from "@/shared/utils/ImgUtil";
import defaultAvatar from "@/assets/user.svg";
import { useLoginStateStore } from "@/shared/store/LoginStateStore";

export function useUserInfoEditor() {
  const loginStateStore = useLoginStateStore();

  /* ————————表单———————— */
  const formRef = useTemplateRef<FormInstance>("formRef");

  const formData = reactive<UpdatedUserInfo>({
    nickName: "",
    avatar: "",
    gender: 2,
    birthday: "",
    school: "",
    personalIntroduction: "",
    noticeInfo: "",
  });

  const rules: FormRules = {
    nickName: [
      { required: true, message: "请输入昵称", trigger: "blur" },
      { min: 1, max: 20, message: "昵称长度为 1-20 个字符", trigger: "blur" },
    ],
    avatar: [{ required: true, message: "请上传头像", trigger: "change" }],
    gender: [{ required: true, message: "请选择性别", trigger: "change" }],
    birthday: [
      {
        pattern: /^\d{4}-\d{2}-\d{2}$/,
        message: "生日格式为 yyyy-MM-dd",
        trigger: "blur",
      },
    ],
    school: [
      {
        min: 0,
        max: 150,
        message: "学校名长度为 0-150 个字符",
        trigger: "blur",
      },
    ],
    personalIntroduction: [
      {
        min: 0,
        max: 200,
        message: "个人简介长度为 0-200 个字符",
        trigger: "blur",
      },
    ],
    noticeInfo: [
      {
        min: 0,
        max: 300,
        message: "公告信息长度为 0-300 个字符",
        trigger: "blur",
      },
    ],
  };

  /* ————————头像上传———————— */
  /** 上传进度百分比，null 表示未在上传中 */
  const uploadProgress = ref<number | null>(null);

  /** 头像预览的完整请求 URL */
  const avatarPreviewUrl = computed(() => {
    if (formData.avatar) {
      if (formData.avatar === loginStateStore.userInfo?.avatar) {
        return imgRequestUrl(formData.avatar);
      } else {
        return imgRequestUrl(formData.avatar, true);
      }
    }
    return defaultAvatar;
  });

  /**
   * 上传头像文件，更新 formData.avatar 并触发字段校验
   * @param file 图片文件
   */
  async function handleAvatarUpload(file: File) {
    uploadProgress.value = 0;
    try {
      const path = await imageApi.uploadImage(file, false, event => {
        if (event.total) {
          uploadProgress.value = Math.round((event.loaded / event.total) * 100);
        }
      });
      if (path) {
        formData.avatar = path;
        formRef.value?.validateField("avatar");
      }
    } finally {
      uploadProgress.value = null;
    }
  }

  return {
    formRef,
    formData,
    rules,
    /** 头像预览完整 URL */
    avatarPreviewUrl,
    /** 头像上传进度百分比，null 表示未在上传中 */
    uploadProgress,
    /** 触发头像文件上传 */
    handleAvatarUpload,
  };
}
