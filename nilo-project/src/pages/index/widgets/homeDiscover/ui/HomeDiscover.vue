<script setup lang="ts">
import HotTopicPanel from './HotTopicPanel.vue'
import HotVideoPanel from './HotVideoPanel.vue'
</script>

<template>
    <!-- 首页底部：左侧 24 小时热门视频，右侧热门话题（热搜词） -->
    <section class="home-discover">
        <HotVideoPanel />
        <HotTopicPanel />
    </section>
</template>

<style lang="scss" scoped>
.home-discover {
    display: grid;
    grid-template-columns: minmax(0, 4fr) minmax(0, 7fr);
    // 两侧等高：右侧网格随左侧卡片拉伸
    align-items: stretch;
    gap: 24px;
    margin-top: 80px;
}
</style>
