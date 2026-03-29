<script lang="ts" setup>
import Dialog from '@/shared/ui/Dialog.vue';
import { useAuthForm } from '../model/useAuthForm';

const authForm = useAuthForm()
const {
    captchaInfo, getCaptcha,
    inLogin, formData, rules,
    changeLogin, submit, closePanel,
    loginStateStore,
} = authForm
const bindFormRef = authForm.formDataRef
</script>

<template>
    <Dialog :show="loginStateStore.showPanel" width="900" :top="120" title="" :showCancel="false"
        :handle-close="closePanel">
        <div class="dialog">
            <div class="background">
                <img src="../../assets/login_background.jpg" alt="背景图" class="background-img" />
            </div>
            <el-form class="form" :model="formData" :rules="rules" :ref="bindFormRef">
                <!-- 登录/注册切换 -->
                <div class="login-items">
                    <div :class="{ active: inLogin, 'login-item': true }" @click="changeLogin(true)">登录</div>
                    <el-divider direction="vertical"></el-divider>
                    <div :class="{ active: !inLogin, 'login-item': true }" @click="changeLogin(false)">注册</div>
                </div>

                <!-- 邮箱输入 -->
                <el-form-item class="form-email" prop="email">
                    <el-input v-model.trim="formData.email" placeholder="请输入邮箱" clearable maxlength="64" size="large">
                        <template #prefix>
                            <img src="../../assets/icon/img/email.svg" alt="email" class="email" />
                        </template>
                    </el-input>
                </el-form-item>

                <!-- 密码输入（登录时显示） -->
                <el-form-item class="form-password" prop="password" v-if="inLogin">
                    <el-input v-model.trim="formData.password" placeholder="请输入密码" show-password clearable
                        maxlength="20" type="password" size="large">
                        <template #prefix>
                            <img src="../../assets/icon/img/password.svg" alt="password" class="password" />
                        </template>
                    </el-input>
                </el-form-item>

                <!-- 注册界面 -->
                <div v-if="!inLogin">
                    <!-- 昵称输入 -->
                    <el-form-item class="form-nickName" prop="nickName">
                        <el-input v-model.trim="formData.nickName" placeholder="请输入昵称" clearable maxlength="20"
                            size="large">
                            <template #prefix>
                                <img src="../../assets/icon/img/nickname.svg" alt="nickName" class="nickName" />
                            </template>
                        </el-input>
                    </el-form-item>
                    <!-- 密码输入 -->
                    <el-form-item class="form-register-password" prop="registerPassword">
                        <el-input v-model.trim="formData.registerPassword" placeholder="请输入密码" show-password clearable
                            maxlength="20" type="password" size="large">
                            <template #prefix>
                                <img src="../../assets/icon/img/password.svg" alt="password" class="registerPassword" />
                            </template>
                        </el-input>
                    </el-form-item>
                    <!-- 确认密码输入 -->
                    <el-form-item class="form-re-register-password" prop="reRegisterPassword">
                        <el-input v-model.trim="formData.reRegisterPassword" placeholder="请再次输入密码" show-password
                            clearable maxlength="20" type="password" size="large">
                            <template #prefix>
                                <img src="../../assets/icon/img/re-password.svg" alt="password"
                                    class="reRegisterPassword" />
                            </template>
                        </el-input>
                    </el-form-item>
                </div>

                <!-- 验证码输入 -->
                <el-form-item class="form-captcha" prop="captcha">
                    <div class="form-captcha-content">
                        <el-input v-model.trim="formData.captcha" placeholder="请输入验证码" clearable maxlength="10"
                            size="large">
                            <template #prefix>
                                <img src="../../assets/icon/img/captcha.svg" alt="captcha" class="captcha" />
                            </template>
                        </el-input>
                        <img v-if="captchaInfo && captchaInfo.captchaImg"
                            :src="'data:image/png;base64,' + captchaInfo.captchaImg" alt="captcha" class="captcha-img"
                            @click="getCaptcha" />
                        <img v-else src="../../assets/loading-bar.gif" alt="captcha" class="captcha-img" />
                    </div>
                </el-form-item>

                <!-- 提交表单！ -->
                <el-form-item class=" form-submit">
                    <div class="form-submit-content">
                        <el-button type="primary" size="large" @click="submit" style="width: 60%;border-radius: 7px;">
                            <span v-if="inLogin">登录</span>
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
                }
            }

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
