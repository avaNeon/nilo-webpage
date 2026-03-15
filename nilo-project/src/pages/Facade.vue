<script setup lang="ts">
import { ref, inject, onMounted, onUnmounted } from 'vue'
import FacadeHeader from '../components/Facade/FacadeHeader.vue'
import Account from '../components/Facade/Account.vue'
import request from '../utils/useRequest'
import { Api } from '../utils/api'
import { useLoginStateStore } from '../store/LoginStateStore'
import message from '../utils/useMessage'

// 获取内容部分最大最小宽度
const mainContentMaxWidth: number = inject('mainContentMaxWidth', 0)
const mainContentMinWidth: number = inject('mainContentMinWidth', 0)
// 判断是否固定顶部变量
const headerFixed = ref(false)
// 不透明度
const headerOpacity = ref(0)

// 滚动监听函数
function scrollChecker() {
    let scrollY = window.scrollY
    if (scrollY <= 40) {
        headerFixed.value = false
        headerOpacity.value = 0
    }
    else {
        headerFixed.value = true
        // 计算不透明度：从 40px 开始出现，到 200px 达到 100%
        // (scrollY - 40) / (200 - 40)
        let opacity = (scrollY - 40) / 160
        headerOpacity.value = Math.min(1, Math.max(0, opacity))
    }
}

const loginStateStore = useLoginStateStore()

async function autoLogin() {
    const result = await request({ method: 'get', url: Api.autoLogin })
    if (!result?.data) {
        return
    }
    loginStateStore.setLoginState(true)
    loginStateStore.setUserInfo(result.data)
    loginStateStore.showPanel = false
    message.success("自动登录成功！欢迎回来！")
}

onMounted(() => {
    window.addEventListener('scroll', scrollChecker)
    autoLogin()
})

onUnmounted(() => {
    window.removeEventListener('scroll', scrollChecker)
})

</script>

<template>
    <div class="page-content" :style="{
        'max-width': mainContentMaxWidth + 'px',
        'min-width': mainContentMinWidth + 'px',
    }">
        <header>
            <div class="header">
                <FacadeHeader />
            </div>
            <div class="fixed-header" v-if="headerFixed" :style="{ opacity: headerOpacity }">
                <FacadeHeader theme="dark" />
            </div>
        </header>
    </div>
    <Account />
</template>

<style>
body {
    background-color: rgb(197, 197, 197) !important;
}
</style>
<style lang="scss" scoped>
.page-content {
    height: 200vh;
    background-color: rgb(255, 255, 255);
}

.header {
    height: 200px;
    background: url("../assets/banner-background-beach.jpg") no-repeat center;
    background-size: cover;
}

.fixed-header {
    position: fixed;
    top: 0;
    width: 100%;
}
</style>