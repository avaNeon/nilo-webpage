<script lang="ts" setup>
import UserHomeSeries from "@/pages/userHome/entities/userHomeSeries/ui/UserHomeSeries.vue";
import UserHomeVideoList from "@/pages/userHome/entities/userHomeVideoList/ui/UserHomeVideoList.vue";
</script>

<template>
    <!-- 首页：最新视频 + 各系列前几个视频；公告和个人资料在外层侧栏 -->
    <div class="user-home-index">
        <UserHomeVideoList />
        <UserHomeSeries />
    </div>
</template>

<style lang="scss" scoped>
.user-home-index {
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-width: 0;
}
</style>
