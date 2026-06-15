<script setup lang="ts">
import { onMounted } from "vue";
import { User, Lock, Key } from "@element-plus/icons-vue";
import { useLogin } from "./composables/useLogin";

const {
    captchaInfo,
    getCaptcha,
    formData,
    rules,
    submitting,
    submit,
} = useLogin();

onMounted(() =>
{
    getCaptcha();
});
</script>

<template>
    <div class="login-page">
        <div class="login-card">
            <!-- 标题 -->
            <div class="card-header">
                <h1 class="card-title">管理员登录</h1>
                <p class="card-subtitle">Nilo Admin Console</p>
            </div>

            <!-- 表单 -->
            <el-form ref="formRef" :model="formData" :rules="rules" label-width="0" size="large" class="login-form"
                @keyup.enter="submit">
                <!-- 账号 -->
                <el-form-item prop="account">
                    <el-input v-model.trim="formData.account" placeholder="管理员账号" clearable maxlength="64"
                        :prefix-icon="User" />
                </el-form-item>

                <!-- 密码 -->
                <el-form-item prop="password">
                    <el-input v-model.trim="formData.password" type="password" placeholder="密码" show-password clearable
                        maxlength="20" :prefix-icon="Lock" />
                </el-form-item>

                <!-- 验证码 -->
                <el-form-item prop="code">
                    <div class="captcha-row">
                        <el-input v-model.trim="formData.code" placeholder="验证码" clearable maxlength="10"
                            :prefix-icon="Key" class="captcha-input" />
                        <img v-if="captchaInfo?.captchaImg" :src="'data:image/png;base64,' + captchaInfo.captchaImg"
                            alt="验证码" class="captcha-img" title="点击刷新验证码" @click="getCaptcha" />
                        <div v-else class="captcha-placeholder" @click="getCaptcha">
                            <span>点击获取</span>
                        </div>
                    </div>
                </el-form-item>

                <!-- 提交按钮 -->
                <el-form-item>
                    <el-button type="primary" size="large" class="submit-btn" :loading="submitting" @click="submit">
                        {{ submitting ? "登录中..." : "登 录" }}
                    </el-button>
                </el-form-item>
            </el-form>
        </div>

        <!-- 底部版权 -->
        <p class="footer-text">Nilo Admin &copy; {{ new Date().getFullYear() }}</p>
    </div>
</template>

<style lang="scss" scoped>
.login-page {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    position: relative;
    overflow: hidden;

    // 装饰性背景圆形
    &::before {
        content: "";
        position: absolute;
        width: 500px;
        height: 500px;
        border-radius: 50%;
        background: rgba($color-bilibili-blue, 0.08);
        top: -120px;
        right: -120px;
    }

    &::after {
        content: "";
        position: absolute;
        width: 400px;
        height: 400px;
        border-radius: 50%;
        background: rgba($color-brand-pink, 0.06);
        bottom: -100px;
        left: -100px;
    }
}

.login-card {
    position: relative;
    z-index: 1;
    width: 420px;
    padding: 48px 40px 36px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.18),
        0 2px 8px rgba(0, 0, 0, 0.06);
    backdrop-filter: blur(10px);
}

.card-header {
    text-align: center;
    margin-bottom: 36px;

    .card-title {
        font-size: 26px;
        font-weight: 700;
        color: $color-text-primary;
        margin: 0 0 8px 0;
        letter-spacing: 2px;
    }

    .card-subtitle {
        font-size: 13px;
        color: $color-text-muted;
        margin: 0;
        letter-spacing: 4px;
        text-transform: uppercase;
    }
}

.login-form {
    :deep(.el-input__wrapper) {
        border-radius: 10px;
        box-shadow: 0 0 0 1px $color-border inset;
        transition: box-shadow 0.3s, border-color 0.3s;

        &:hover {
            box-shadow: 0 0 0 1px $color-bilibili-blue inset;
        }
    }

    :deep(.el-input__wrapper.is-focus) {
        box-shadow: 0 0 0 2px rgba($color-bilibili-blue, 0.3) inset;
    }

    :deep(.el-form-item) {
        margin-bottom: 22px;
    }

    :deep(.el-form-item__error) {
        font-size: 12px;
        padding-top: 4px;
    }
}

.captcha-row {
    display: flex;
    gap: 12px;
    align-items: center;
    width: 100%;

    .captcha-input {
        flex: 1;
        min-width: 0;
    }

    .captcha-img {
        flex-shrink: 0;
        height: 40px;
        width: 110px;
        border-radius: 10px;
        border: 1px solid $color-border;
        cursor: pointer;
        object-fit: cover;
        transition: transform 0.2s, box-shadow 0.2s;

        &:hover {
            transform: scale(1.04);
            box-shadow: 0 2px 8px $color-mask-20;
        }

        &:active {
            transform: scale(0.98);
        }
    }

    .captcha-placeholder {
        flex-shrink: 0;
        height: 40px;
        width: 110px;
        border-radius: 10px;
        border: 1px dashed $color-border;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        color: $color-text-muted;
        transition: border-color 0.2s, color 0.2s;

        &:hover {
            border-color: $color-bilibili-blue;
            color: $color-bilibili-blue;
        }
    }
}

.submit-btn {
    width: 100%;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 6px;
    height: 46px;
    background: linear-gradient(135deg, $color-bilibili-blue, #0095d9);
    border: none;
    transition: opacity 0.3s, transform 0.2s;

    &:hover {
        opacity: 0.92;
        transform: translateY(-1px);
    }

    &:active {
        transform: translateY(0);
    }
}

.footer-text {
    position: relative;
    z-index: 1;
    margin-top: 32px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
    letter-spacing: 1px;
}
</style>
