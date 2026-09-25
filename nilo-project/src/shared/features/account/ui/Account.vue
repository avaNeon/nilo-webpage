<script lang="ts" setup>
import { useTemplateRef } from 'vue';
import { STRENGTH_LABELS } from '../model/passwordStrength';
import { NICK_NAME_MAX, useAuthForm } from '../model/useAuthForm';
import AuthBrandPanel from './AuthBrandPanel.vue';
import AuthField from './AuthField.vue';

const {
    loginStateStore, captchaInfo, refreshCaptcha,
    inLogin, inRegister, inForgot,
    formData, errors,
    brandCopy, doneCopy, pupil, done,
    showPassword, togglePassword,
    showEmailCode, showNickName, showNewPassword,
    codeSent, countdown, sendingCode, sendCodeText, maskedEmail,
    nickNameLength, strength, passwordMatched,
    passwordPlaceholder, confirmPlaceholder,
    submitText, submitDisabled,
    setMode, sendEmailCode, submit, closePanel, finishDone,
    onFieldFocus, onFieldBlur,
} = useAuthForm()

const emailField = useTemplateRef('emailField')
</script>

<template>
    <!-- 不用 align-center：窗口比弹窗矮的时候，居中会把上半截挤到屏幕外面滚不回来 -->
    <el-dialog v-model="loginStateStore.showPanel" class="auth-dialog" width="880px"
        top="max(24px, calc(50vh - 330px))" :show-close="false" :with-header="false" :close-on-click-modal="false"
        aria-label="登录光点" @opened="emailField?.focus()">
        <div class="auth-shell">
            <AuthBrandPanel :label="brandCopy.label" :title="brandCopy.title" :sub="brandCopy.sub"
                :pupil-transform="pupil.transform" :alert="pupil.alert" />

            <button class="auth-close" type="button" aria-label="关闭" @click="closePanel">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"
                    stroke-linecap="round" aria-hidden="true">
                    <path d="M2 2l8 8M10 2l-8 8" />
                </svg>
            </button>

            <div class="auth-main">
                <!-- 登录 / 注册切换；忘记密码时换成标题 + 返回 -->
                <div v-if="!inForgot && !done" class="tabs" role="tablist">
                    <span :class="['tabs-thumb', { 'on-right': inRegister }]"></span>
                    <button type="button" role="tab" :aria-selected="inLogin" :class="['tab', { active: inLogin }]"
                        @click="setMode('login')">登录</button>
                    <button type="button" role="tab" :aria-selected="inRegister"
                        :class="['tab', { active: inRegister }]" @click="setMode('register')">注册</button>
                </div>
                <div v-else-if="inForgot && !done" class="forgot-head">
                    <h2>找回密码</h2>
                    <button type="button" class="back" @click="setMode('login')">← 返回登录</button>
                </div>

                <form v-if="!done" class="form" novalidate @submit.prevent="submit">
                    <AuthField ref="emailField" v-model="formData.email" icon="email" type="email" placeholder="邮箱"
                        autocomplete="email" maxlength="64" :error="errors.email"
                        @focus="onFieldFocus('email')" @blur="onFieldBlur('email')" />

                    <!-- 登录：密码 + 图形验证码 + 忘记密码入口 -->
                    <template v-if="inLogin">
                        <AuthField v-model="formData.password" icon="lock" :type="showPassword ? 'text' : 'password'"
                            placeholder="密码" autocomplete="current-password" maxlength="20" compact-end
                            :error="errors.password" @focus="onFieldFocus('password')"
                            @blur="onFieldBlur('password')">
                            <template #suffix>
                                <button type="button" class="pw-toggle" @mousedown.prevent
                                    @click="togglePassword">{{ showPassword ? '隐藏' : '显示' }}</button>
                            </template>
                        </AuthField>

                        <AuthField v-model="formData.captcha" icon="shield" placeholder="图形验证码" autocomplete="off"
                            maxlength="10" :error="errors.captcha" @focus="onFieldFocus('captcha')"
                            @blur="onFieldBlur('captcha')">
                            <template #side>
                                <button type="button" class="captcha" title="看不清？换一张" @click="refreshCaptcha">
                                    <img v-if="captchaInfo?.captchaImg"
                                        :src="'data:image/png;base64,' + captchaInfo.captchaImg"
                                        alt="图形验证码，点击换一张" />
                                    <span v-else>加载中…</span>
                                </button>
                            </template>
                        </AuthField>

                        <div class="forgot-link">
                            <button type="button" @click="setMode('forgot')">忘记密码？</button>
                        </div>
                    </template>

                    <!-- 注册 / 忘记密码发码后：邮箱验证码 -->
                    <AuthField v-if="showEmailCode" v-model="formData.emailCode" icon="code" placeholder="邮箱验证码"
                        autocomplete="one-time-code" maxlength="6" :error="errors.emailCode"
                        @focus="onFieldFocus('emailCode')" @blur="onFieldBlur('emailCode')">
                        <template #side>
                            <button type="button" class="send-code" :disabled="countdown > 0 || sendingCode"
                                @click="sendEmailCode">{{ sendCodeText }}</button>
                        </template>
                        <template #hint>
                            <span v-if="codeSent && !errors.emailCode" class="hint">
                                验证码已发送至 <b>{{ maskedEmail }}</b>，5 分钟内有效
                            </span>
                        </template>
                    </AuthField>

                    <AuthField v-if="showNickName" v-model="formData.nickName" icon="user" placeholder="昵称"
                        autocomplete="nickname" :maxlength="NICK_NAME_MAX" :error="errors.nickName"
                        @focus="onFieldFocus('nickName')" @blur="onFieldBlur('nickName')">
                        <template #suffix>
                            <span class="nick-count">{{ nickNameLength }}/{{ NICK_NAME_MAX }}</span>
                        </template>
                    </AuthField>

                    <!-- 注册 / 重置：新密码（带强度）+ 再次输入 -->
                    <template v-if="showNewPassword">
                        <AuthField v-model="formData.password" icon="lock" :type="showPassword ? 'text' : 'password'"
                            :placeholder="passwordPlaceholder" autocomplete="new-password" maxlength="20" compact-end
                            :error="errors.password" @focus="onFieldFocus('password')"
                            @blur="onFieldBlur('password')">
                            <template #suffix>
                                <button type="button" class="pw-toggle" @mousedown.prevent
                                    @click="togglePassword">{{ showPassword ? '隐藏' : '显示' }}</button>
                            </template>
                            <template #hint>
                                <div v-if="formData.password && !errors.password" class="strength">
                                    <i v-for="n in 4" :key="n"
                                        :class="{ on: n <= strength, weak: strength === 1 }"></i>
                                    <b>{{ STRENGTH_LABELS[strength] }}</b>
                                    <span v-if="strength < 3">· 混合大小写、数字和符号更安全</span>
                                </div>
                            </template>
                        </AuthField>

                        <AuthField v-model="formData.confirmPassword" icon="check"
                            :type="showPassword ? 'text' : 'password'" :placeholder="confirmPlaceholder"
                            autocomplete="new-password" maxlength="20"
                            :ok="passwordMatched && !errors.confirmPassword" :error="errors.confirmPassword"
                            @focus="onFieldFocus('confirmPassword')" @blur="onFieldBlur('confirmPassword')" />
                    </template>

                    <button type="submit" class="submit" :disabled="submitDisabled">{{ submitText }}</button>

                    <p v-if="inForgot" class="forgot-hint">输入邮箱并发送验证码。若该邮箱尚未注册，将引导你完成注册。</p>
                </form>

                <!-- 提交成功后的结果页 -->
                <div v-else-if="doneCopy" class="done" role="status">
                    <span class="done-label">{{ doneCopy.label }}</span>
                    <h2>{{ doneCopy.title }}</h2>
                    <p>{{ doneCopy.sub }}</p>
                    <button type="button" class="done-action" @click="finishDone">{{ doneCopy.button }}</button>
                </div>
            </div>
        </div>
    </el-dialog>
</template>

<style lang="scss">
// el-dialog 是挂到 body 上的，scoped 样式够不到外壳，所以外壳单独写在这里
.el-dialog.auth-dialog {
    --el-dialog-padding-primary: 10px;
    padding: 10px;
    border-radius: 32px;
    background: #FFFFFF;
    box-shadow: 0 0 0 1px rgba(11, 12, 18, 0.06), 0 40px 80px -30px rgba(11, 12, 18, 0.5);
    color: $warm-ink;
    -webkit-font-smoothing: antialiased;

    .el-dialog__header {
        display: none;
    }

    .el-dialog__body {
        padding: 0;
        color: inherit;
        font-size: 14px;
    }
}

// base.scss 里 `* { font-family }` 是直接命中每个元素的，光设在外壳上继承不下去
.auth-dialog,
.auth-dialog * {
    font-family: $warm-font-sans;
}
</style>

<style lang="scss" scoped>
$danger: oklch(0.55 0.2 25);

.auth-shell {
    position: relative;
    display: grid;
    grid-template-columns: 360px minmax(0, 1fr);
    min-height: 620px;
}

.auth-close {
    position: absolute;
    top: 6px;
    right: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: $warm-sunken;
    color: $warm-ink-3;
    cursor: pointer;
    transition: background 0.15s;

    &:hover {
        background: $warm-sunken-hover;
    }

    &:focus-visible {
        outline: 2px solid $warm-accent;
        outline-offset: 2px;
    }
}

.auth-main {
    display: flex;
    flex-direction: column;
    gap: 26px;
    padding: 56px 56px 40px 48px;
}

/* —— 登录 / 注册切换 —— */
.tabs {
    position: relative;
    align-self: flex-start;
    display: grid;
    grid-template-columns: 1fr 1fr;
    width: 220px;
    height: 46px;
    padding: 4px;
    border-radius: 999px;
    background: $warm-sunken;
}

.tabs-thumb {
    position: absolute;
    top: 4px;
    bottom: 4px;
    left: 4px;
    width: calc(50% - 4px);
    border-radius: 999px;
    background: #FFFFFF;
    box-shadow: 0 1px 2px rgba(11, 12, 18, 0.08), 0 6px 14px -6px rgba(11, 12, 18, 0.18);
    transition: transform 0.35s cubic-bezier(0.3, 1.2, 0.5, 1);

    &.on-right {
        transform: translateX(100%);
    }

    @media (prefers-reduced-motion: reduce) {
        transition: none;
    }
}

.tab {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: transparent;
    font-size: 15px;
    font-weight: 700;
    color: $warm-ink-4;
    cursor: pointer;
    transition: color 0.2s;

    &.active {
        color: $warm-accent;
    }

    &:focus-visible {
        outline: 2px solid $warm-accent;
        outline-offset: -2px;
    }
}

/* —— 忘记密码顶部 —— */
.forgot-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 46px;

    h2 {
        margin: 0;
        font-size: 22px;
        font-weight: 800;
        letter-spacing: -0.01em;
    }

    .back {
        display: flex;
        align-items: center;
        gap: 6px;
        height: 34px;
        padding: 0 14px;
        border: 0;
        border-radius: 999px;
        background: transparent;
        font-size: 13px;
        font-weight: 600;
        color: $warm-accent;
        cursor: pointer;

        &:hover {
            background: $warm-accent-soft;
        }
    }
}

/* —— 表单 —— */
.form {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.pw-toggle {
    display: flex;
    align-items: center;
    height: 32px;
    padding: 0 12px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    font-size: 12px;
    font-weight: 600;
    color: $warm-ink-4;
    cursor: pointer;

    &:hover {
        background: $warm-accent-soft;
        color: $warm-accent;
    }
}

.captcha {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    height: 50px;
    // 后端验证码图（200×70）字一直排到边，两头留一点，不然会被胶囊的圆头切掉
    padding: 0 8px;
    border: 0;
    border-radius: 999px;
    background: repeating-linear-gradient(135deg, #F3F4F7 0 6px, #EBEDF2 6px 12px);
    font-family: $warm-font-mono;
    font-size: 12px;
    color: #8A8E9A;
    cursor: pointer;
    transition: box-shadow 0.15s;

    &:hover,
    &:focus-visible {
        outline: 0;
        box-shadow: inset 0 0 0 1.5px $warm-accent;
    }

    img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
        // 图片自带白底，叠上去让底纹透出来，看起来就是字直接写在胶囊上
        mix-blend-mode: multiply;
        user-select: none;
    }
}

.send-code {
    height: 50px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: $warm-ink;
    font-size: 13px;
    font-weight: 600;
    font-feature-settings: 'tnum';
    color: #FFFFFF;
    cursor: pointer;
    transition: background 0.2s;

    &:disabled {
        background: $warm-sunken;
        color: #8A8E9A;
        cursor: default;
    }
}

.hint {
    padding-left: 20px;
    font-size: 12px;
    line-height: 1.5;
    color: $warm-ink-4;

    b {
        font-family: $warm-font-mono;
        font-weight: 400;
        color: $warm-ink;
    }
}

.nick-count {
    font-family: $warm-font-mono;
    font-size: 11px;
    color: #8A8E9A;
}

.strength {
    display: flex;
    align-items: center;
    gap: 6px;
    padding-left: 20px;
    font-size: 12px;

    i {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #E3E5EB;
        transition: background 0.2s;

        &.on {
            background: $warm-accent;
        }

        &.on.weak {
            background: $danger;
        }
    }

    b {
        margin-left: 6px;
        font-weight: 600;
        color: $warm-ink-3;
    }

    span {
        color: #8A8E9A;
    }
}

.forgot-link {
    display: flex;
    justify-content: flex-end;
    margin-top: -2px;

    button {
        height: 30px;
        padding: 0 12px;
        border: 0;
        border-radius: 999px;
        background: transparent;
        font-size: 13px;
        font-weight: 600;
        color: $warm-accent;
        cursor: pointer;

        &:hover {
            background: $warm-accent-soft;
        }
    }
}

.submit {
    height: 52px;
    margin-top: 10px;
    border: 0;
    border-radius: 999px;
    background: $warm-accent;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: #FFFFFF;
    box-shadow: 0 14px 28px -14px rgba(0, 0, 242, 0.8);
    cursor: pointer;
    transition: opacity 0.2s, background 0.15s;

    &:hover:not(:disabled) {
        background: #0000C8;
    }

    &:disabled {
        opacity: 0.7;
        cursor: default;
    }

    &:focus-visible {
        outline: 2px solid $warm-accent;
        outline-offset: 3px;
    }
}

.forgot-hint {
    margin: 0;
    padding: 0 8px;
    font-size: 12px;
    line-height: 1.7;
    color: $warm-ink-4;
    text-wrap: pretty;
}

/* —— 结果页 —— */
.done {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 14px;
    padding-bottom: 40px;

    .done-label {
        font-family: $warm-font-mono;
        font-size: 11px;
        letter-spacing: 0.22em;
        color: $warm-accent;
    }

    h2 {
        margin: 0;
        font-size: 32px;
        font-weight: 800;
        letter-spacing: -0.01em;
        line-height: 1.25;
    }

    p {
        margin: 0;
        font-size: 14px;
        line-height: 1.75;
        color: $warm-ink-3;
        text-wrap: pretty;
    }

    .done-action {
        align-self: flex-start;
        height: 48px;
        margin-top: 14px;
        padding: 0 28px;
        border: 0;
        border-radius: 999px;
        background: $warm-ink;
        font-size: 14px;
        font-weight: 700;
        color: #FFFFFF;
        cursor: pointer;
        transition: background 0.15s;

        &:hover {
            background: #2A2C35;
        }
    }
}
</style>
