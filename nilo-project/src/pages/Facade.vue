<script setup lang="ts">
import { inject, onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'
import FacadeHeader from '@/widgets/facadeHeader/ui/FacadeHeader.vue'
import Account from '@/features/account/ui/Account.vue'
import Category from '@/features/category/ui/Category.vue'
import defaultBg from '@/assets/banner-background-beach.jpg'
import { BODY_PADDING } from '@/shared/config/Config'
import { useBackgroundImg } from './composables/useBackgroundImg'
import { useCategory } from './composables/useCategory'
import { useScroll } from './composables/useScroll'

const { bgImgUrl } = useBackgroundImg()
const { startRouteWatching } = useCategory()
const { headerFixed, categoryFolded, hideFixedFolded, headerOpacity, scrollChecker } = useScroll()

// 获取内容部分最大最小宽度
const mainContentMaxWidth: number = inject('mainContentMaxWidth', 0)
const mainContentMinWidth: number = inject('mainContentMinWidth', 0)


onMounted(() => {
    window.addEventListener('scroll', scrollChecker)
    startRouteWatching()
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
                'background-image': bgImgUrl ? `url(${bgImgUrl})` : `url(${defaultBg})`
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
        <div class="router-view" :style="{
            'marginLeft': BODY_PADDING,
            'margin-right': BODY_PADDING
        }">
            <RouterView></RouterView>
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

.router-view {
    margin-top: 110px;
}
</style>
