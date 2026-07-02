import { onMounted, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { SystemConfigApi } from "@/pages/index/widgets/systemSetting/api/SystemConfigApi";
import {
  createDefaultSystemConfig,
  type SystemConfig,
} from "@/pages/index/widgets/systemSetting/model/SystemConfig";
import message from "@/shared/lib/message";

/** 系统配置页加载与提交逻辑 */
export function useSystemSetting() {
  const formRef = ref<FormInstance>();
  const formData = ref<SystemConfig>(createDefaultSystemConfig());
  const loading = ref(false);
  const submitting = ref(false);

  const formRules: FormRules<SystemConfig> = {
    videoFileMaxSize: [{ required: true, type: "number", min: 0, message: "不能小于 0", trigger: "blur" }],
    imageMaxSize: [{ required: true, type: "number", min: 0, message: "不能小于 0", trigger: "blur" }],
    dailyVideoUploadSize: [{ required: true, type: "number", min: 0, message: "不能小于 0", trigger: "blur" }],
    dailyImageUploadSize: [{ required: true, type: "number", min: 0, message: "不能小于 0", trigger: "blur" }],
    maxResolutionRatio: [{ required: true, message: "请输入最大分辨率", trigger: "blur" }],
    maxBitRate: [{ required: true, type: "number", min: 1, message: "不能小于 1", trigger: "blur" }],
    videoMaxEpisodes: [{ required: true, type: "number", min: 1, message: "不能小于 1", trigger: "blur" }],
    maxSerieVideosNumber: [{ required: true, type: "number", min: 1, message: "不能小于 1", trigger: "blur" }],
    maxSeriesNumber: [{ required: true, type: "number", min: 1, message: "不能小于 1", trigger: "blur" }],
    registerCoin: [{ required: true, type: "number", min: 0, message: "不能小于 0", trigger: "blur" }],
    rewardsPreUpload: [{ required: true, type: "number", min: 0, message: "不能小于 0", trigger: "blur" }],
    modifyNickNameCost: [{ required: true, type: "number", min: 1, message: "不能小于 1", trigger: "blur" }],
  };

  async function loadSystemConfig() {
    loading.value = true;
    try {
      const result = await SystemConfigApi.getSystemConfig();
      if (result) {
        formData.value = { ...createDefaultSystemConfig(), ...result };
      }
    } finally {
      loading.value = false;
    }
  }

  async function handleSubmit() {
    if (!formRef.value) return;

    const valid = await formRef.value.validate().catch(() => false);
    if (!valid) return;

    submitting.value = true;
    try {
      const result = await SystemConfigApi.updateSystemConfig(formData.value);
      if (result && result.code === 200) {
        message.success("配置已保存");
      }
    } finally {
      submitting.value = false;
    }
  }

  function handleReset() {
    loadSystemConfig();
  }

  onMounted(() => {
    loadSystemConfig();
  });

  return {
    formRef,
    formData,
    formRules,
    loading,
    submitting,
    handleSubmit,
    handleReset,
  };
}
