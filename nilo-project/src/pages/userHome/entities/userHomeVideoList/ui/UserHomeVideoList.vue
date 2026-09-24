<script lang="ts" setup>
import { useRoute } from 'vue-router';
import { formatRelativeDay } from '@/shared/utils/DateUtil';
import GlassSection from '@/pages/userHome/shared/ui/GlassSection.vue';
import GlassVideoCard from '@/pages/userHome/shared/ui/GlassVideoCard.vue';
import GlassVideoSkeleton from '@/pages/userHome/shared/ui/GlassVideoSkeleton.vue';
import GlassEmpty from '@/pages/userHome/shared/ui/GlassEmpty.vue';
import { useUserHomeVideoList } from '../model/useUserHomeVideoList';

const { videoInfoList, hasVideo, count, loading } = useUserHomeVideoList()

const route = useRoute()
</script>

<template>
    <GlassSection title="视频" :count="count">
        <template v-if="hasVideo" #actions>
            <RouterLink :to="{ name: 'userUpload', params: { userId: route.params.userId } }" class="more-link">
                查看全部 →
            </RouterLink>
        </template>

        <div v-if="loading" class="video-grid">
            <GlassVideoSkeleton :count="5" />
        </div>
        <div v-else-if="hasVideo" class="video-grid">
            <GlassVideoCard v-for="(item, index) in videoInfoList" :key="item.videoId ?? index" :video="item"
                :meta="formatRelativeDay(item.lastUpdateTime ?? item.createTime)" />
        </div>
        <GlassEmpty v-else title="还没有发布视频" />
    </GlassSection>
</template>

<style lang="scss" scoped>
@use '@/pages/userHome/shared/styles/glass' as *;

.more-link {
    @include glass-chip-button;
    color: $warm-accent;
    text-decoration: none;
}

.video-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 14px;
}
</style>
