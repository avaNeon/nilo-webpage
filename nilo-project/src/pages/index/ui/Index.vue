<script setup lang="ts">
import { inject, onMounted, onUnmounted, provide } from 'vue'
import { RouterView } from 'vue-router'
import IndexHeader from '@/widgets/indexHeader/ui/IndexHeader.vue'
import Account from '@/features/account/ui/Account.vue'
import Category from '@/entities/category/ui/Category.vue'
import defaultBg from '@/assets/banner-background-beach.jpg'
import { BODY_PADDING } from '@/shared/config/Config'
import { useBackgroundImg } from '../composables/useBackgroundImg'
import { useCategory } from '../composables/useCategory'
import { useScroll } from '../composables/useScroll'
import VideoList from '@/widgets/videoList/ui/VideoList.vue'
import { useVideo } from '../composables/useVideo'

const { bgImgUrl } = useBackgroundImg()
const { startRouteWatching } = useCategory()
const { videoList, isLoading, loadVideoList, } = useVideo()
const { headerFixed, categoryFolded, subCategoryFolded, headerOpacity, scrollChecker } = useScroll(videoList, isLoading, loadVideoList)

// 获取内容部分最大最小宽度
const mainContentMaxWidth: number = inject('mainContentMaxWidth', 0)
const mainContentMinWidth: number = inject('mainContentMinWidth', 0)

provide('videoList', videoList)
provide('isLoading', isLoading)
provide('subCategoryFolded', subCategoryFolded)

onMounted(() =>
{
    startRouteWatching()
    window.addEventListener('scroll', scrollChecker)
})

onUnmounted(() =>
{
    window.removeEventListener('scroll', scrollChecker)
})
</script>

<template>
    <div class="page-content" :style="{
        'max-width': mainContentMaxWidth + 'px',
        'min-width': mainContentMinWidth + 'px',
    }">
        <!-- 顶部锚点 -->
        <div class="fixed-header-anchor" :style="{
            'max-width': mainContentMaxWidth + 'px',
            'min-width': mainContentMinWidth + 'px',
        }">
            <div class="fixed-header" v-if="headerFixed" :style="{
                opacity: headerOpacity,
                'max-width': mainContentMaxWidth + 'px',
                'min-width': mainContentMinWidth + 'px',
            }">
                <IndexHeader theme="dark" />
            </div>
            <Category v-if="categoryFolded" :folded="true" :max-width="mainContentMaxWidth"
                :min-width="mainContentMinWidth">
            </Category>
        </div>

        <header>
            <div class="header" :style="{
                'background-image': bgImgUrl ? `url(${bgImgUrl})` : `url(${defaultBg})`
            }">
                <IndexHeader />
            </div>
        </header>
        <div class="category" :style="{
            'max-width': mainContentMaxWidth + 'px',
            'min-width': mainContentMinWidth + 'px',
        }">
            <Category :folded="false" :max-width="mainContentMaxWidth" :min-width="mainContentMinWidth">
            </Category>
        </div>
        <div class="router-view" :style="{
            'margin-left': BODY_PADDING,
            'margin-right': BODY_PADDING,
        }">
            <RouterView></RouterView>
        </div>
        <div class="video-list" :style="{
            'margin-left': BODY_PADDING,
            'margin-right': BODY_PADDING
        }">
            <VideoList></VideoList>
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
    position: relative;
    min-height: 150vh;
    background-color: rgb(255, 255, 255);
    margin: 0 auto;

    header {
        width: 100%;
        position: relative;

        .header {
            height: 200px;
            background: no-repeat center;
            background-size: cover;

        }

    }

    .fixed-header-anchor {
        position: sticky;
        top: 0;
        height: 0;
        z-index: 200;
        overflow: visible;
    }

    .fixed-header {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
    }

    .category {
        width: 100%;
    }

    .router-view {
        margin-bottom: 10px;
    }
}
</style>
