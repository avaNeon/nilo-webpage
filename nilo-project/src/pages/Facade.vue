<script setup lang="ts">
import { ref, inject, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import FacadeHeader from '../components/Facade/FacadeHeader.vue'
import Account from '../components/Facade/Account.vue'
import Category from '../components/Facade/Category.vue'
import useCategoryStore from '../store/CategoryStore'
import { Api, ServicePrefixMap } from '../utils/api'
import defaultBg from '../assets/banner-background-beach.jpg'

// 获取内容部分最大最小宽度
const mainContentMaxWidth: number = inject('mainContentMaxWidth', 0)
const mainContentMinWidth: number = inject('mainContentMinWidth', 0)
// 判断是否固定顶部变量
const headerFixed = ref(false)
// category 是否折叠
const categoryFolded = ref(false)
// 锁定是否不出现顶栏分类，为true时代表不会出现顶栏分类
const hideFixedFolded = ref(false)
// 不透明度
const headerOpacity = ref(0)

const route = useRoute()
const categoryStore = useCategoryStore()

// 监听路由参数变化，或是分类信息加载完成后的变化，自动更新 Store 状态
// 这样即使用户直接在地址栏输入 URL，或者点击后退/前进按钮，分类状态都能同步
watch([() => route.params.categoryNumber, () => categoryStore.categoryMap], ([categoryNumber]) => {
    categoryStore.setCurrentPCategoryByNumber((categoryNumber || null) as string | null)
}, { immediate: true })

// 监听完整路径，如果是首页则清空分类
watch(() => route.path, (newPath) => {
    if (newPath === '/facade' || newPath === '/') {
        categoryStore.setCurrentPCategoryByNumber(null)
    }
})

// 请求背景头图的完整url
const backgroundImageRequestUrl = computed((): string | null => {
    const path = categoryStore.currentPCategory?.background
    if (!path) return null
    // 直接把后端接口地址和图片路径拼接起来
    // 浏览器会自动发出 GET 请求获取图片流
    return `${import.meta.env.VITE_APP_BASE_URL}${ServicePrefixMap.web}${Api.sourcePath}${path}`
})

// 滚动监听函数
function scrollChecker() {
    let scrollY = window.scrollY
    if (scrollY <= 30) {
        headerFixed.value = false
        headerOpacity.value = 0
    }
    else {
        headerFixed.value = true
        // 计算不透明度：从 30px 开始出现，到 100px 达到 100%
        // (scrollY - 30) / (100 - 30)
        let opacity = (scrollY - 30) / 70
        headerOpacity.value = Math.min(1, Math.max(0, opacity))
    }

    // 当滚动高度超过 banner 高度时（这里是 200px），让 category 折叠
    // 也可以根据实际高度微调这个值
    categoryFolded.value = scrollY > 250
}

onMounted(() => {
    window.addEventListener('scroll', scrollChecker)
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
            <div class="header" :style="{
                'background-image': backgroundImageRequestUrl ? `url(${backgroundImageRequestUrl})` : `url(${defaultBg})`
            }">
                <FacadeHeader />
            </div>
            <div class="fixed-header" v-if="headerFixed" :style="{ opacity: headerOpacity }">
                <FacadeHeader theme="dark" />
            </div>
        </header>
        <div class="category">
            <Category :folded="categoryFolded && !hideFixedFolded"></Category>
        </div>
        <div style="height: 200px; background-color: blueviolet;">

        </div>
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

    .header {
        height: 200px;
        background: no-repeat center;
        background-size: cover;
    }

    .fixed-header {
        position: fixed;
        top: 0;
        width: 100%;
        z-index: 200;
    }

    .category {
        position: absolute;
        width: 100%;
        z-index: 100;
    }
}
</style>