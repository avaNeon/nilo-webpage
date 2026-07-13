import {
  reactive,
  ref,
  nextTick,
  watch,
  useTemplateRef,
  computed,
  onBeforeUnmount,
} from "vue";
import { useCaptcha } from "./useCaptcha";
import { useLoginStateStore } from "@/shared/store/LoginStateStore";
import { regs } from "@/shared/utils/VerifyUtil";
import message from "@/shared/lib/message";
import type { FormInstance } from "element-plus";
import type { EmailCodeScene } from "./LoginInfo";
import { AccountApi } from "../api/accountApi";
import type { TokenUserInfo } from "@/shared/model/TokenUserInfo";
import { useAccount } from "@/shared/composables/useAccount";

/** 面板模式：登录 / 注册 / 忘记密码 */
export type AuthPanelMode = "login" | "register" | "forgot";

const EMAIL_CODE_COOLDOWN_SEC = 60;

export function useAuthForm() {
  const loginStateStore = useLoginStateStore();
  const { saveUserState } = useAccount();

  const formData = reactive({
    email: "",
    password: "",
    captcha: "",
    captchaKey: "",
    nickName: "",
    registerPassword: "",
    reRegisterPassword: "",
    emailCode: "",
    newPassword: "",
    reNewPassword: "",
  });

  const formDataRef = useTemplateRef<FormInstance>("formDataRef");
  /** 当前面板模式 */
  const mode = ref<AuthPanelMode>("login");
  /**
   * 发码后后端实际生效场景（以后端 data 为准）。
   * 忘记密码入口可能返回 REGISTER，需引导完善注册信息。
   */
  const emailScene = ref<EmailCodeScene | null>(null);

  const countdown = ref(0);
  let countdownTimer: ReturnType<typeof setInterval> | null = null;

  const inLogin = computed(() => mode.value === "login");
  const inRegister = computed(() => mode.value === "register");
  const inForgot = computed(() => mode.value === "forgot");

  /** 忘记密码分支后走注册表单 */
  const forgotAsRegister = computed(
    () => mode.value === "forgot" && emailScene.value === "REGISTER",
  );
  /** 忘记密码分支后走重置密码表单 */
  const forgotAsReset = computed(
    () => mode.value === "forgot" && emailScene.value === "RESET_PASSWORD",
  );
  /** 注册或「忘记密码→注册」需要昵称+密码 */
  const showRegisterFields = computed(
    () => inRegister.value || forgotAsRegister.value,
  );
  /** 「忘记密码→重置」需要新密码 */
  const showResetFields = computed(() => forgotAsReset.value);
  /** 注册 / 忘记密码需要邮箱验证码输入 */
  const showEmailCode = computed(
    () =>
      inRegister.value ||
      (inForgot.value && emailScene.value != null),
  );

  const canSendEmailCode = computed(
    () => countdown.value <= 0 && Boolean(formData.email.trim()),
  );

  function clearCountdown() {
    if (countdownTimer != null) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
    countdown.value = 0;
  }

  function startCountdown(seconds = EMAIL_CODE_COOLDOWN_SEC) {
    clearCountdown();
    countdown.value = seconds;
    countdownTimer = setInterval(() => {
      countdown.value -= 1;
      if (countdown.value <= 0) {
        clearCountdown();
      }
    }, 1000);
  }

  onBeforeUnmount(() => clearCountdown());

  function clearFields() {
    Object.assign(formData, {
      email: "",
      password: "",
      captcha: "",
      nickName: "",
      registerPassword: "",
      reRegisterPassword: "",
      emailCode: "",
      newPassword: "",
      reNewPassword: "",
    });
    emailScene.value = null;
  }

  async function resetForm(refreshCaptcha: boolean) {
    if (refreshCaptcha) {
      await getCaptcha();
    }
    nextTick(() => {
      formDataRef.value?.resetFields();
      clearFields();
    });
  }

  function setMode(next: AuthPanelMode) {
    mode.value = next;
    clearCountdown();
    void resetForm(next === "login");
  }

  function changeLogin(toLogin: boolean) {
    setMode(toLogin ? "login" : "register");
  }

  function openForgot() {
    setMode("forgot");
  }

  function backToLogin() {
    setMode("login");
  }

  const { captchaInfo, getCaptcha } = useCaptcha();

  watch(
    () => loginStateStore.showPanel,
    val => {
      if (val) {
        mode.value = "login";
        clearCountdown();
        emailScene.value = null;
        getCaptcha();
      } else {
        clearCountdown();
      }
    },
  );

  watch(captchaInfo, val => {
    formData.captchaKey = val?.captchaKey || "";
  });

  function validateConfirmRegister(_rule: any, value: any, callback: any) {
    if (value === "") {
      callback(new Error("请再次输入密码"));
    } else if (value !== formData.registerPassword) {
      callback(new Error("两次输入的密码不一致！"));
    } else {
      callback();
    }
  }

  function validateConfirmNew(_rule: any, value: any, callback: any) {
    if (value === "") {
      callback(new Error("请再次输入新密码"));
    } else if (value !== formData.newPassword) {
      callback(new Error("两次输入的密码不一致！"));
    } else {
      callback();
    }
  }

  const passwordRuleMsg =
    "密码必须在8-20个字符之间，且包含字母和数字，可以使用这些特殊符号：!@#$%^&*()_+-=";

  const rules = {
    email: [
      { required: true, message: "请输入邮箱", trigger: "blur" },
      { type: "email" as const, message: "请输入正确的邮箱地址", trigger: "blur" },
    ],
    password: [
      { required: true, message: "请输入密码", trigger: "blur" },
      {
        pattern: regs.password,
        message: passwordRuleMsg,
        trigger: "blur",
      },
    ],
    captcha: [{ required: true, message: "请输入验证码", trigger: "blur" }],
    nickName: [
      { required: true, message: "请输入昵称", trigger: "blur" },
      { max: 20, message: "昵称不能超过20个字符", trigger: "blur" },
    ],
    registerPassword: [
      { required: true, message: "请输入密码", trigger: "blur" },
      {
        pattern: regs.password,
        message: passwordRuleMsg,
        trigger: "blur",
      },
    ],
    reRegisterPassword: [
      { required: true, message: "请再次输入密码", trigger: "blur" },
      { validator: validateConfirmRegister, trigger: "blur" },
    ],
    emailCode: [
      { required: true, message: "请输入邮箱验证码", trigger: "blur" },
      {
        pattern: regs.emailCode,
        message: "验证码为6位数字或字母",
        trigger: "blur",
      },
    ],
    newPassword: [
      { required: true, message: "请输入新密码", trigger: "blur" },
      {
        pattern: regs.password,
        message: passwordRuleMsg,
        trigger: "blur",
      },
    ],
    reNewPassword: [
      { required: true, message: "请再次输入新密码", trigger: "blur" },
      { validator: validateConfirmNew, trigger: "blur" },
    ],
  };

  /** 发送邮箱验证码 */
  async function sendEmailCode() {
    if (!formDataRef.value) return;

    try {
      await formDataRef.value.validateField("email");
    } catch {
      message.error("请先填写正确的邮箱");
      return;
    }

    if (countdown.value > 0) {
      message.warning(`请稍后再试（${countdown.value}s）`);
      return;
    }

    const requestScene: EmailCodeScene =
      mode.value === "register" ? "REGISTER" : "RESET_PASSWORD";

    const actualScene = await AccountApi.sendEmailCode(
      { email: formData.email, scene: requestScene },
      (data: any) => {
        // 1010：冷却 — 启动倒计时
        if (data?.code === 1010) {
          startCountdown(EMAIL_CODE_COOLDOWN_SEC);
        }
      },
    );

    if (!actualScene) return;

    // 以后端返回的实际场景为准
    emailScene.value = actualScene;
    startCountdown(EMAIL_CODE_COOLDOWN_SEC);

    if (mode.value === "forgot" && actualScene === "REGISTER") {
      message.info("该邮箱尚未注册，请完善注册信息");
    } else {
      message.success("验证码已发送，请查收邮件（5分钟内有效）");
    }
  }

  function submit() {
    formDataRef.value?.validate(async (valid: boolean) => {
      if (!valid) {
        message.error("请检查输入是否正确");
        return;
      }

      if (mode.value === "login") {
        await submitLogin();
        return;
      }

      if (mode.value === "register" || forgotAsRegister.value) {
        await submitRegister();
        return;
      }

      if (forgotAsReset.value) {
        await submitReset();
        return;
      }

      // 忘记密码尚未发码 / 未拿到场景
      message.warning("请先获取邮箱验证码");
    });
  }

  async function submitLogin() {
    const errorCallback = () => getCaptcha();
    const tokenUserInfo: TokenUserInfo | null = await AccountApi.login(
      {
        email: formData.email,
        password: formData.password,
        code: formData.captcha,
        captchaKey: formData.captchaKey,
      },
      errorCallback,
    );
    if (!tokenUserInfo) return;

    message.success("登录成功！");
    loginStateStore.setLoginState(true);
    loginStateStore.setUserInfo(tokenUserInfo.userInfo);
    saveUserState();
    loginStateStore.showPanel = false;
    nextTick(() => {
      formDataRef.value?.resetFields();
      clearFields();
    });
  }

  async function submitRegister() {
    const ok = await AccountApi.register({
      email: formData.email,
      nickName: formData.nickName,
      password: formData.registerPassword,
      emailCode: formData.emailCode,
    });
    if (!ok) return;

    message.success("注册成功，请登录！");
    setMode("login");
  }

  async function submitReset() {
    const ok = await AccountApi.resetPassword({
      email: formData.email,
      emailCode: formData.emailCode,
      newPassword: formData.newPassword,
    });
    if (!ok) return;

    message.success("密码重置成功，请登录！");
    setMode("login");
  }

  function closePanel() {
    loginStateStore.showPanel = false;
  }

  return {
    captchaInfo,
    getCaptcha,
    mode,
    inLogin,
    inRegister,
    inForgot,
    emailScene,
    forgotAsRegister,
    forgotAsReset,
    showRegisterFields,
    showResetFields,
    showEmailCode,
    countdown,
    canSendEmailCode,
    formData,
    formDataRef,
    rules,
    changeLogin,
    openForgot,
    backToLogin,
    sendEmailCode,
    submit,
    closePanel,
    loginStateStore,
  };
}
