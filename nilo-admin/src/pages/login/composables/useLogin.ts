import { reactive, ref, useTemplateRef, watch } from "vue";
import { useRouter } from "vue-router";
import type { FormInstance, FormRules } from "element-plus";
import type { CaptchaInfo } from "@/shared/model/CaptchaInfo";
import { AdminApi } from "@/shared/api/AdminApi";
import message from "@/shared/lib/message";

/** 验证码请求最小间隔（毫秒） */
const CAPTCHA_DELAY = 500;

export function useLogin() {
  const router = useRouter();

  // ── 验证码 ──
  const isRequestingCaptcha = ref(false);
  const captchaInfo = ref<CaptchaInfo>();

  /** 获取验证码 */
  const getCaptcha = async () => {
    if (isRequestingCaptcha.value) return;
    isRequestingCaptcha.value = true;
    try {
      const data = await AdminApi.captcha();
      if (data) {
        captchaInfo.value = data as unknown as CaptchaInfo;
      }
    } catch {
      message.error("验证码加载失败");
    } finally {
      setTimeout(() => {
        isRequestingCaptcha.value = false;
      }, CAPTCHA_DELAY);
    }
  };

  // 获取验证码后自动同步 captchaKey
  watch(captchaInfo, val => {
    formData.captchaKey = val?.captchaKey ?? "";
  });

  // ── 表单数据 ──
  const formData = reactive({
    account: "",
    password: "",
    code: "",
    captchaKey: "",
  });

  /** 密码正则 — 与后端一致：8~20 位，至少包含一个字母和一个数字，允许特殊符号 */
  const passwordRegExp =
    /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=]{8,20}$/;

  // ── 表单校验规则 ──
  const rules: FormRules = {
    account: [{ required: true, message: "请输入管理员账号", trigger: "blur" }],
    password: [
      { required: true, message: "请输入密码", trigger: "blur" },
      {
        pattern: passwordRegExp,
        message: "密码必须为 8~20 位，包含字母和数字",
        trigger: "blur",
      },
    ],
    code: [{ required: true, message: "请输入验证码", trigger: "blur" }],
  };

  // ── 登录提交 ──
  const formRef = useTemplateRef<FormInstance>("formRef");
  const submitting = ref(false);

  const submit = async () => {
    if (!formRef.value) return;
    const valid = await formRef.value.validate().catch(() => false);
    if (!valid) return;

    submitting.value = true;
    try {
      const result = await AdminApi.login({
        account: formData.account,
        password: formData.password,
        captchaKey: formData.captchaKey,
        code: formData.code,
      });

      if (result) {
        message.success("登录成功");
        router.replace("/");
      } else {
        // 失败后刷新验证码
        getCaptcha();
      }
    } finally {
      submitting.value = false;
    }
  };

  return {
    /** 验证码信息 */
    captchaInfo,
    /** 获取验证码 */
    getCaptcha,
    /** 表单绑定对象 */
    formData,
    /** 校验规则 */
    rules,
    /** 是否正在提交 */
    submitting,
    /** 提交表单 */
    submit,
  };
}
