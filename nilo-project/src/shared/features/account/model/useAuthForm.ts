import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import { useCaptcha } from "./useCaptcha";
import { useLoginStateStore } from "@/shared/store/LoginStateStore";
import { regs } from "@/shared/utils/VerifyUtil";
import message from "@/shared/lib/message";
import type { EmailCodeScene } from "./LoginInfo";
import { AccountApi } from "../api/accountApi";
import type { TokenUserInfo } from "@/shared/model/TokenUserInfo";
import { useAccount } from "@/shared/composables/useAccount";
import {
  BRAND_COPY,
  buildDoneCopy,
  maskEmail,
  type AuthPanelMode,
} from "./authCopy";
import { passwordStrength } from "./passwordStrength";

export type AuthField =
  | "email"
  | "password"
  | "captcha"
  | "emailCode"
  | "nickName"
  | "confirmPassword";

const FIELD_KEYS: AuthField[] = [
  "email",
  "password",
  "captcha",
  "emailCode",
  "nickName",
  "confirmPassword",
];

const EMAIL_CODE_COOLDOWN_SEC = 60;
export const NICK_NAME_MAX = 20;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASSWORD_RULE_MSG =
  "密码必须在8-20个字符之间，且包含字母和数字，可以使用这些特殊符号：!@#$%^&*()_+-=";

function blankForm(): Record<AuthField, string> {
  return {
    email: "",
    password: "",
    captcha: "",
    emailCode: "",
    nickName: "",
    confirmPassword: "",
  };
}

export function useAuthForm() {
  const loginStateStore = useLoginStateStore();
  const { saveUserState } = useAccount();
  const { captchaInfo, getCaptcha } = useCaptcha();

  const formData = reactive<Record<AuthField, string>>(blankForm());
  const errors = reactive<Partial<Record<AuthField, string>>>({});
  /** 当前聚焦的输入框，左侧的「瞳孔」跟着它动 */
  const focusedField = ref<AuthField | null>(null);
  const showPassword = ref(false);

  const mode = ref<AuthPanelMode>("login");
  /**
   * 发码后后端实际生效场景（以后端 data 为准）。
   * 忘记密码入口可能返回 REGISTER，需引导完善注册信息。
   */
  const emailScene = ref<EmailCodeScene | null>(null);
  /** 提交中（登录 / 注册 / 重置） */
  const busy = ref(false);
  /** 提交成功后停在结果页，值是刚完成的那种操作 */
  const done = ref<AuthPanelMode | null>(null);

  const countdown = ref(0);
  const sendingCode = ref(false);
  let countdownTimer: ReturnType<typeof setInterval> | null = null;

  const inLogin = computed(() => mode.value === "login");
  const inRegister = computed(() => mode.value === "register");
  const inForgot = computed(() => mode.value === "forgot");

  /** 忘记密码分支后走注册表单 */
  const forgotAsRegister = computed(
    () => inForgot.value && emailScene.value === "REGISTER",
  );
  /** 忘记密码分支后走重置密码表单 */
  const forgotAsReset = computed(
    () => inForgot.value && emailScene.value === "RESET_PASSWORD",
  );
  /** 注册，或「忘记密码→注册」：多一个昵称 */
  const showNickName = computed(
    () => inRegister.value || forgotAsRegister.value,
  );
  /** 注册 / 忘记密码拿到场景后：新密码 + 确认密码 */
  const showNewPassword = computed(
    () => showNickName.value || forgotAsReset.value,
  );
  /** 注册 / 忘记密码发码后：邮箱验证码输入 */
  const showEmailCode = computed(
    () => inRegister.value || (inForgot.value && emailScene.value != null),
  );
  /** 已经发过验证码 */
  const codeSent = computed(() => emailScene.value != null);

  const maskedEmail = computed(() => maskEmail(formData.email.trim()));
  const nickNameLength = computed(() => [...formData.nickName].length);
  const strength = computed(() => passwordStrength(formData.password));
  const passwordMatched = computed(
    () =>
      Boolean(formData.confirmPassword) &&
      formData.confirmPassword === formData.password,
  );
  const passwordPlaceholder = computed(() =>
    forgotAsReset.value ? "新密码（8-20 位）" : "密码（8-20 位）",
  );
  const confirmPlaceholder = computed(() =>
    forgotAsReset.value ? "再次输入新密码" : "再次输入密码",
  );

  const brandCopy = computed(() => BRAND_COPY[mode.value]);
  const doneCopy = computed(() =>
    done.value ? buildDoneCopy(done.value, maskedEmail.value) : null,
  );

  const sendCodeText = computed(() => {
    if (countdown.value > 0) return `${countdown.value}s 后重发`;
    if (sendingCode.value) return "发送中…";
    return codeSent.value ? "重新发送" : "发送验证码";
  });

  const submitText = computed(() => {
    if (busy.value) {
      if (inLogin.value) return "登录中…";
      return inRegister.value ? "注册中…" : "提交中…";
    }
    if (inLogin.value) return "登录";
    if (showNickName.value) return "注册";
    if (forgotAsReset.value) return "重置密码";
    // 忘记密码还没发码：提交按钮就是「发送验证码」
    if (countdown.value > 0) return `${countdown.value}s 后可重发`;
    return sendingCode.value ? "发送中…" : "发送邮箱验证码";
  });
  const submitDisabled = computed(
    () =>
      busy.value ||
      (inForgot.value &&
        emailScene.value == null &&
        (countdown.value > 0 || sendingCode.value)),
  );

  const hasError = computed(() => Object.values(errors).some(Boolean));

  /** 左侧圆眼睛里的瞳孔：看向输入框、捂眼、提交时缩小、成功时放大、出错时变红 */
  const pupil = computed(() => {
    let x = 27;
    let y = -27;
    let sx = 1;
    let sy = 1;
    const field = focusedField.value;
    const onPassword = field === "password" || field === "confirmPassword";
    if (done.value) {
      x = 0;
      y = 0;
      sx = sy = 1.45;
    } else if (busy.value) {
      x = 0;
      y = 0;
      sx = sy = 0.6;
    } else if (onPassword && !showPassword.value) {
      // 输入密码时眯成一条缝
      x = 0;
      y = 16;
      sx = 1.5;
      sy = 0.12;
    } else if (onPassword) {
      x = -40;
      y = -36;
    } else if (field) {
      // 随着输入内容变长，视线从左往右扫
      const progress = Math.min(formData[field].length / 26, 1);
      x = Math.round(-36 + progress * 72);
      y = 32;
    } else if (hasError.value) {
      x = 0;
      y = 0;
    }
    return {
      transform: `translate(${x}px, ${y}px) scale(${sx}, ${sy})`,
      alert: hasError.value && !done.value,
    };
  });

  // ---------- 倒计时 ----------

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

  // ---------- 状态重置 ----------

  function clearErrors() {
    for (const key of FIELD_KEYS) delete errors[key];
  }

  function resetPanel(next: AuthPanelMode, keepEmail: boolean) {
    const email = keepEmail ? formData.email : "";
    mode.value = next;
    Object.assign(formData, blankForm(), { email });
    clearErrors();
    focusedField.value = null;
    showPassword.value = false;
    emailScene.value = null;
    busy.value = false;
    done.value = null;
    sendingCode.value = false;
    clearCountdown();
    if (next === "login") void getCaptcha();
  }

  /** 切换登录 / 注册 / 忘记密码：邮箱保留，其余清空 */
  function setMode(next: AuthPanelMode) {
    if (next === mode.value && !done.value) return;
    resetPanel(next, true);
  }

  watch(
    () => loginStateStore.showPanel,
    open => {
      if (open) resetPanel("login", false);
      else clearCountdown();
    },
  );

  // 改动哪个输入框，就撤掉它的错误提示
  for (const key of FIELD_KEYS) {
    watch(
      () => formData[key],
      () => {
        delete errors[key];
      },
    );
  }

  // ---------- 校验 ----------

  function emailError(): string | undefined {
    const email = formData.email.trim();
    if (!email) return "请输入邮箱";
    if (!EMAIL_PATTERN.test(email)) return "请输入正确的邮箱地址";
    return undefined;
  }

  function validate(): boolean {
    const found: Partial<Record<AuthField, string>> = {};
    const email = emailError();
    if (email) found.email = email;

    if (inLogin.value) {
      if (!formData.password) found.password = "请输入密码";
      if (!formData.captcha.trim()) found.captcha = "请输入验证码";
    } else {
      const code = formData.emailCode.trim();
      if (!code) found.emailCode = "请输入邮箱验证码";
      else if (!regs.emailCode.test(code))
        found.emailCode = "验证码为6位数字或字母";

      if (showNickName.value) {
        const nick = formData.nickName.trim();
        if (!nick) found.nickName = "请输入昵称";
        else if ([...nick].length > NICK_NAME_MAX)
          found.nickName = `昵称不能超过${NICK_NAME_MAX}个字符`;
      }

      if (!formData.password) {
        found.password = forgotAsReset.value ? "请输入新密码" : "请输入密码";
      } else if (!regs.password.test(formData.password)) {
        found.password = PASSWORD_RULE_MSG;
      }
      if (!formData.confirmPassword) {
        found.confirmPassword = forgotAsReset.value
          ? "请再次输入新密码"
          : "请再次输入密码";
      } else if (formData.confirmPassword !== formData.password) {
        found.confirmPassword = "两次输入的密码不一致";
      }
    }

    clearErrors();
    Object.assign(errors, found);
    return Object.keys(found).length === 0;
  }

  // ---------- 动作 ----------

  function refreshCaptcha() {
    formData.captcha = "";
    void getCaptcha();
  }

  /** 发送邮箱验证码 */
  async function sendEmailCode() {
    if (countdown.value > 0 || sendingCode.value || busy.value) return;

    const invalid = emailError();
    if (invalid) {
      errors.email = invalid;
      return;
    }

    const requestScene: EmailCodeScene = inRegister.value
      ? "REGISTER"
      : "RESET_PASSWORD";

    sendingCode.value = true;
    try {
      const actualScene = await AccountApi.sendEmailCode(
        { email: formData.email.trim(), scene: requestScene },
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

      if (inForgot.value && actualScene === "REGISTER") {
        message.info("该邮箱尚未注册，请完善注册信息");
      }
    } finally {
      sendingCode.value = false;
    }
  }

  async function submitLogin() {
    const tokenUserInfo: TokenUserInfo | null = await AccountApi.login(
      {
        email: formData.email.trim(),
        password: formData.password,
        code: formData.captcha.trim(),
        captchaKey: captchaInfo.value?.captchaKey ?? "",
      },
      // 验证码错了 / 过期了：换一张，输入框清空
      refreshCaptcha,
    );
    if (!tokenUserInfo) return;

    loginStateStore.setLoginState(true);
    loginStateStore.setUserInfo(tokenUserInfo.userInfo);
    saveUserState();
    done.value = "login";
  }

  async function submitRegister() {
    const ok = await AccountApi.register({
      email: formData.email.trim(),
      nickName: formData.nickName.trim(),
      password: formData.password,
      emailCode: formData.emailCode.trim(),
    });
    if (ok) done.value = "register";
  }

  async function submitReset() {
    const ok = await AccountApi.resetPassword({
      email: formData.email.trim(),
      emailCode: formData.emailCode.trim(),
      newPassword: formData.password,
    });
    if (ok) done.value = "forgot";
  }

  async function submit() {
    if (busy.value || done.value) return;

    // 忘记密码还没发码时，提交按钮的作用就是发码
    if (inForgot.value && emailScene.value == null) {
      await sendEmailCode();
      return;
    }
    if (!validate()) return;

    busy.value = true;
    try {
      if (inLogin.value) await submitLogin();
      else if (showNickName.value) await submitRegister();
      else await submitReset();
    } finally {
      busy.value = false;
    }
  }

  function togglePassword() {
    showPassword.value = !showPassword.value;
  }

  function onFieldFocus(field: AuthField) {
    focusedField.value = field;
  }

  function onFieldBlur(field: AuthField) {
    if (focusedField.value === field) focusedField.value = null;
  }

  function closePanel() {
    loginStateStore.showPanel = false;
  }

  /** 结果页上的按钮：登录成功 → 关窗口；注册 / 重置密码成功 → 回到登录 */
  function finishDone() {
    if (done.value === "login") {
      closePanel();
      // 登录后用户数据不会自动加载，刷新一次走自动登录流程
      window.location.reload();
    } else setMode("login");
  }

  return {
    loginStateStore,
    captchaInfo,
    refreshCaptcha,
    mode,
    inLogin,
    inRegister,
    inForgot,
    formData,
    errors,
    brandCopy,
    doneCopy,
    pupil,
    busy,
    done,
    showPassword,
    togglePassword,
    showEmailCode,
    showNickName,
    showNewPassword,
    codeSent,
    countdown,
    sendingCode,
    sendCodeText,
    maskedEmail,
    nickNameLength,
    strength,
    passwordMatched,
    passwordPlaceholder,
    confirmPlaceholder,
    submitText,
    submitDisabled,
    setMode,
    sendEmailCode,
    submit,
    closePanel,
    finishDone,
    onFieldFocus,
    onFieldBlur,
  };
}
