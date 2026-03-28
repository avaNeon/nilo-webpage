<script lang="ts" setup>
import { reactive, ref, nextTick, watch } from 'vue';
import Dialog from '../public/Dialog.vue';
import useVerify from '../../utils/useVerify';
import { useLoginStateStore } from '../../store/LoginStateStore';
import request from '../../utils/useRequest';
import { Api } from '../../utils/Api';
import { type CaptchaInfo } from '../../models/CaptchaInfo';
import message from '../../utils/useMessage';

const { regs } = useVerify()

// 切换登录注册页面
const inLogin = ref(true)
// 切换登录/注册界面
function changeLogin(change: boolean) {
    inLogin.value = change
    resetForm()
}

// 表单绑定对象
const formData = reactive({
    email: '',
    password: '',
    captcha: '',
    captchaKey: '',
    nickName: '',
    registerPassword: '',
    reRegisterPassword: ''
})
// 表单验证规则
const rules = {
    email: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { pattern: regs.password, message: '密码必须在8-20个字符之间，且包含字母和数字，可以使用这些特殊符号：!@#$%^&*()_+-=', trigger: 'blur' }
    ],
    captcha: [
        { required: true, message: '请输入验证码', trigger: 'blur' },
    ],
    nickName: [
        { required: true, message: '请输入昵称', trigger: 'blur' },
        { max: 20, message: '昵称不能超过20个字符', trigger: 'blur' }
    ],
    registerPassword: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { pattern: regs.password, message: '密码必须在8-20个字符之间，且包含字母和数字，可以使用这些特殊符号：!@#$%^&*()_+-=', trigger: 'blur' }
    ],
    reRegisterPassword: [
        { required: true, message: '请再次输入密码', trigger: 'blur' },
        { validator: validateConfirm, trigger: 'blur' }
    ]
}
// 确认密码验证函数
function validateConfirm(_rule: any, value: any, callback: any) {
    if (value === '') {
        callback(new Error('请再次输入密码'))
    } else if (value !== formData.registerPassword) {
        callback(new Error("两次输入的密码不一致！"))
    } else {
        callback()
    }
}
// 表单对象的ref
const formDataRef = ref()
// 提交表单
function submitForm() {
    formDataRef.value.validate(async (valid: boolean) => {
        if (valid) {
            let params = {
                email: formData.email,
                nickName: formData.nickName,
                password: formData.password,
                code: formData.captcha,
                captchaKey: formData.captchaKey,
            }
            if (!inLogin.value) {
                params.password = formData.registerPassword
            }
            let result = await request({
                method: "post",
                url: inLogin.value ? Api.login : Api.register,
                data: params,
                dataType: 'json',
                errorCallback() {
                    requestCaptcha()
                }
            })
            if (result) {
                if (!inLogin.value) {
                    message.success('注册成功，请登录！')
                    changeLogin(true)
                }
                else {
                    message.success('登录成功！')
                    loginStateStore.setLoginState(true)
                    loginStateStore.setUserInfo(result.data)
                    loginStateStore.showPanel = false
                    // 清理一下表单数据，避免下次打开登录面板时还残留上次的数据
                    nextTick(() => {
                        formDataRef.value.resetFields()
                        Object.assign(formData, {
                            email: '',
                            password: '',
                            captcha: '',
                            nickName: '',
                            registerPassword: '',
                            reRegisterPassword: ''
                        })
                    })
                }
            }
        }
        else {
            message.error('请检查输入是否正确')
            return
        }
    })
}
// 重置表单
function resetForm() {
    requestCaptcha()
    nextTick(() => {
        formDataRef.value.resetFields()
        Object.assign(formData, {
            email: '',
            password: '',
            captcha: '',
            nickName: '',
            registerPassword: '',
            reRegisterPassword: ''
        })
    })
}

// 登录状态管理
const loginStateStore = useLoginStateStore()
// 验证码信息对象
const captchaInfo = ref<CaptchaInfo>()
// 设置一个验证码请求状态变量，防止短时间内重复请求验证码
const isRequestingCaptcha = ref(false)
// 请求验证码
const requestCaptcha = async () => {
    if (isRequestingCaptcha.value) { return }
    isRequestingCaptcha.value = true
    try {
        let response = await request({
            method: "get",
            url: Api.captcha
        })
        if (response) {
            captchaInfo.value = response.data
            formData.captchaKey = captchaInfo.value?.captchaKey || ''
        }
    }
    catch (error) {
        console.error("获取验证码失败：", error)
    }
    finally {
        // 设置定时器，每隔500ms才能请求下一次
        setTimeout(() => {
            isRequestingCaptcha.value = false
        }, 500)
    }

}

function closePanel() {
    loginStateStore.showPanel = false
}

watch(() => loginStateStore.showPanel, (val) => {
    if (val) {
        requestCaptcha()
    }
})
</script>

<template>
    <Dialog :show="loginStateStore.showPanel" width="900" :top="120" title="" :showCancel="false"
        :handle-close="closePanel">
        <div class="dialog">
            <div class="background">
                <img src="../../assets/login_background.jpg" alt="背景图" class="background-img" />
            </div>
            <el-form class="form" :model="formData" :rules="rules" ref="formDataRef">
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
                            @click="requestCaptcha" />
                        <img v-else src="../../assets/loading-bar.gif" alt="captcha" class="captcha-img" />
                    </div>
                </el-form-item>

                <!-- 提交表单！ -->
                <el-form-item class=" form-submit">
                    <div class="form-submit-content">
                        <el-button type="primary" size="large" @click="submitForm"
                            style="width: 60%;border-radius: 7px;">
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
