<script setup lang="ts">
import { inject, onMounted } from 'vue'
import SiteHeader from '@/shared/widgets/siteHeader/ui/SiteHeader.vue'
import HomeHero from '@/pages/index/widgets/homeHero/ui/HomeHero.vue'
import ForYouSection from '@/pages/index/widgets/forYou/ui/ForYouSection.vue'
import LatestSection from '@/pages/index/widgets/latestVideos/ui/LatestSection.vue'
import HotVideoPanel from '@/pages/index/widgets/homeDiscover/ui/HotVideoPanel.vue'
import HotTopicPanel from '@/pages/index/widgets/homeDiscover/ui/HotTopicPanel.vue'
import HomeFooter from '@/pages/index/widgets/homeFooter/ui/HomeFooter.vue'
import { useCategory } from '../composables/useCategory'
import { useRecommendVideos } from '../composables/useRecommendVideos'

// 获取内容部分最大最小宽度
const mainContentMaxWidth: number = inject('mainContentMaxWidth', 0)
const mainContentMinWidth: number = inject('mainContentMinWidth', 0)

// 分类状态跟随路由；先于各区块启动，保证它们首次读取到的就是当前路由的分类
const { startRouteWatching } = useCategory()
startRouteWatching()

// 推荐视频只请求一次：前几个给轮播，其余给「为你推荐」
const { heroSlides, forYouVideos, isLoading: isRecommendLoading, loadRecommendVideos } = useRecommendVideos()

onMounted(() =>
{
    loadRecommendVideos()
})
</script>

<template>
    <div class="home-page warm-theme">
        <!-- AI 助手放在顶栏搜索框旁边（「AI 搜索」弹层） -->
        <SiteHeader ai-search />
        <main class="home-main" :style="{
            'max-width': mainContentMaxWidth + 'px',
            'min-width': mainContentMinWidth + 'px',
        }">
            <HomeHero :slides="heroSlides" :loading="isRecommendLoading" />
            <ForYouSection :videos="forYouVideos" :loading="isRecommendLoading" />
            <LatestSection :scroll-ready="!isRecommendLoading" />
            <HotVideoPanel />
        </main>
        <!-- 热门话题是通栏色块，放在 main 外面 -->
        <HotTopicPanel />
        <HomeFooter />
    </div>
</template>

<style lang="scss" scoped>
.home-page {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 100vh;
}

.home-main {
    flex: 1 0 auto;
    width: 100%;
    margin: 0 auto;
    padding: 8px 48px 0;
}
</style>
