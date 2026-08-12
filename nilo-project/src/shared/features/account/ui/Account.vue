<script lang="ts" setup>
import Dialog from '@/shared/ui/Dialog.vue';
import { useAuthForm } from '../model/useAuthForm';

const {
    captchaInfo, getCaptcha,
    inLogin, inForgot,
    showRegisterFields, showResetFields, showEmailCode,
    countdown, canSendEmailCode,
    formData, rules,
    changeLogin, openForgot, backToLogin,
    sendEmailCode, submit, closePanel,
    loginStateStore,
} = useAuthForm()
</script>

<template>
    <Dialog :show="loginStateStore.showPanel" width="900" :top="80" title="" :showCancel="false"
        :handle-close="closePanel">
        <div class="dialog">
            <el-form class="form" :model="formData" :rules="rules" ref="formDataRef">
                <!-- 登录/注册切换；忘记密码时显示返回 -->
                <div class="login-items" v-if="!inForgot">
                    <div :class="{ active: inLogin, 'login-item': true }" @click="changeLogin(true)">登录</div>
                    <el-divider direction="vertical"></el-divider>
                    <div :class="{ active: !inLogin, 'login-item': true }" @click="changeLogin(false)">注册</div>
                </div>
                <div class="login-items forgot-title" v-else>
                    <div class="login-item active">忘记密码</div>
                    <div class="back-login" @click="backToLogin">返回登录</div>
                </div>

                <!-- 邮箱 -->
                <el-form-item class="form-email" prop="email">
                    <el-input v-model.trim="formData.email" placeholder="请输入邮箱" clearable maxlength="64" size="large">
                        <template #prefix>
                            <img src="@/assets/icon/img/email.svg" alt="email" class="email" />
                        </template>
                    </el-input>
                </el-form-item>

                <!-- 忘记密码：尚未发码时，仅提供发送入口 -->
                <el-form-item class="form-email-code" v-if="inForgot && !showEmailCode">
                    <div class="form-email-code-content send-only">
                        <el-button class="send-code-btn" type="primary" size="large" plain :disabled="!canSendEmailCode"
                            @click="sendEmailCode">
                            {{ countdown > 0 ? `${countdown}s 后可重发` : '发送邮箱验证码' }}
                        </el-button>
                    </div>
                </el-form-item>

                <div class="forgot-hint" v-if="inForgot && !showEmailCode">
                    输入邮箱并发送验证码。若该邮箱尚未注册，将引导你完成注册。
                </div>

                <!-- 注册 / 忘记密码发码后：邮箱验证码 + 重发 -->
                <el-form-item class="form-email-code" prop="emailCode" v-if="showEmailCode">
                    <div class="form-email-code-content">
                        <el-input v-model.trim="formData.emailCode" placeholder="请输入邮箱验证码" clearable maxlength="6"
                            size="large">
                            <template #prefix>
                                <img src="@/assets/icon/img/captcha.svg" alt="emailCode" class="captcha" />
                            </template>
                        </el-input>
                        <el-button class="send-code-btn" size="large" :disabled="!canSendEmailCode"
                            @click="sendEmailCode">
                            {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
                        </el-button>
                    </div>
                </el-form-item>

                <!-- 登录：密码 -->
                <el-form-item class="form-password" prop="password" v-if="inLogin">
                    <el-input v-model.trim="formData.password" placeholder="请输入密码" show-password clearable
                        maxlength="20" type="password" size="large">
                        <template #prefix>
                            <img src="@/assets/icon/img/password.svg" alt="password" class="password" />
                        </template>
                    </el-input>
                </el-form-item>

                <!-- 注册 / 忘记密码→注册：昵称 + 密码 -->
                <template v-if="showRegisterFields">
                    <el-form-item class="form-nickName" prop="nickName">
                        <el-input v-model.trim="formData.nickName" placeholder="请输入昵称" clearable maxlength="20"
                            size="large">
                            <template #prefix>
                                <img src="@/assets/icon/img/nickname.svg" alt="nickName" class="nickName" />
                            </template>
                        </el-input>
                    </el-form-item>
                    <el-form-item class="form-register-password" prop="registerPassword">
                        <el-input v-model.trim="formData.registerPassword" placeholder="请输入密码" show-password clearable
                            maxlength="20" type="password" size="large">
                            <template #prefix>
                                <img src="@/assets/icon/img/password.svg" alt="password" class="registerPassword" />
                            </template>
                        </el-input>
                    </el-form-item>
                    <el-form-item class="form-re-register-password" prop="reRegisterPassword">
                        <el-input v-model.trim="formData.reRegisterPassword" placeholder="请再次输入密码" show-password
                            clearable maxlength="20" type="password" size="large">
                            <template #prefix>
                                <img src="@/assets/icon/img/re-password.svg" alt="password"
                                    class="reRegisterPassword" />
                            </template>
                        </el-input>
                    </el-form-item>
                </template>

                <!-- 忘记密码→重置：新密码 -->
                <template v-if="showResetFields">
                    <el-form-item class="form-register-password" prop="newPassword">
                        <el-input v-model.trim="formData.newPassword" placeholder="请输入新密码" show-password clearable
                            maxlength="20" type="password" size="large">
                            <template #prefix>
                                <img src="@/assets/icon/img/password.svg" alt="password" class="registerPassword" />
                            </template>
                        </el-input>
                    </el-form-item>
                    <el-form-item class="form-re-register-password" prop="reNewPassword">
                        <el-input v-model.trim="formData.reNewPassword" placeholder="请再次输入新密码" show-password clearable
                            maxlength="20" type="password" size="large">
                            <template #prefix>
                                <img src="@/assets/icon/img/re-password.svg" alt="password"
                                    class="reRegisterPassword" />
                            </template>
                        </el-input>
                    </el-form-item>
                </template>

                <!-- 登录：图形验证码 -->
                <el-form-item class="form-captcha" prop="captcha" v-if="inLogin">
                    <div class="form-captcha-content">
                        <el-input v-model.trim="formData.captcha" placeholder="请输入验证码" clearable maxlength="10"
                            size="large">
                            <template #prefix>
                                <img src="@/assets/icon/img/captcha.svg" alt="captcha" class="captcha" />
                            </template>
                        </el-input>
                        <img v-if="captchaInfo && captchaInfo.captchaImg"
                            :src="'data:image/png;base64,' + captchaInfo.captchaImg" alt="captcha" class="captcha-img"
                            @click="getCaptcha" />
                        <img v-else src="@/assets/loading-bar.gif" alt="captcha" class="captcha-img" />
                    </div>
                </el-form-item>

                <!-- 登录：忘记密码入口 -->
                <div class="forgot-link" v-if="inLogin">
                    <span @click="openForgot">忘记密码？</span>
                </div>

                <!-- 提交 -->
                <el-form-item class="form-submit">
                    <div class="form-submit-content">
                        <el-button type="primary" size="large" @click="submit" style="width: 60%;border-radius: 7px;"
                            :disabled="inForgot && !showEmailCode">
                            <span v-if="inLogin">登录</span>
                            <span v-else-if="showResetFields">重置密码</span>
                            <span v-else>注册</span>
                        </el-button>
                    </div>
                </el-form-item>
            </el-form>
        </div>
    </Dialog>
</template>

<style lang="scss" scoped>
.dialog {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .background {
        .background-img {
            height: 300px;
        }
    }

    .form {
        width: 300px;

        .login-items {
            display: flex;
            justify-content: space-evenly;
            align-items: center;
            margin: 20px 40px;
            font-size: 18px;
            font-weight: 500;

            .active {
                color: #4fa5d9;
            }

            .login-item {
                &:hover {
                    cursor: pointer;
                }
            }

            &.forgot-title {
                justify-content: space-between;
                margin: 20px 10px;

                .back-login {
                    font-size: 14px;
                    font-weight: 400;
                    color: #4fa5d9;
                    cursor: pointer;
                }
            }
        }

        .form-email {
            .email {
                width: 20px;
            }
        }

        .form-password {
            .password {
                width: 20px;
            }
        }

        .form-nickName {
            .nickName {
                width: 20px;
            }
        }

        .form-register-password {
            .registerPassword {
                width: 20px;
            }
        }

        .form-re-register-password {
            margin-top: 28px;

            .reRegisterPassword {
                width: 20px;
            }
        }

        .form-captcha {
            margin-top: 28px;

            .form-captcha-content {
                display: flex;
                justify-content: space-between;
                align-items: center;

                .captcha {
                    width: 20px;
                }

                .captcha-img {
                    border: rgb(154, 154, 154) solid 1px;
                    width: 100px;
                    margin-left: 20px;
                    cursor: pointer;
                }
            }
        }

        .form-email-code {
            margin-top: 28px;

            .form-email-code-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 10px;
                width: 100%;

                .captcha {
                    width: 20px;
                }

                .send-code-btn {
                    flex-shrink: 0;
                    min-width: 100px;
                    border-radius: 7px;
                }

                &.send-only {
                    justify-content: center;

                    .send-code-btn {
                        width: 100%;
                        min-width: 0;
                    }
                }
            }
        }

        .forgot-link {
            text-align: right;
            margin: -8px 0 12px;
            font-size: 13px;
            color: #4fa5d9;

            span {
                cursor: pointer;

                &:hover {
                    text-decoration: underline;
                }
            }
        }

        .forgot-hint {
            font-size: 12px;
            color: #888;
            line-height: 1.5;
            margin-bottom: 12px;
        }

        .form-submit {
            .form-submit-content {
                width: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
            }
        }
    }
}
</style>
