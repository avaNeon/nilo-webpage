<script lang="ts" setup>
import { useTemplateRef } from "vue";
import { formatCount } from "@/shared/utils/NumberUtil";
import { formatRelativeDay } from "@/shared/utils/DateUtil";
import GlassSection from "@/pages/userHome/shared/ui/GlassSection.vue";
import GlassVideoCard from "@/pages/userHome/shared/ui/GlassVideoCard.vue";
import GlassVideoSkeleton from "@/pages/userHome/shared/ui/GlassVideoSkeleton.vue";
import GlassPagination from "@/pages/userHome/shared/ui/GlassPagination.vue";
import GlassEmpty from "@/pages/userHome/shared/ui/GlassEmpty.vue";
import type { CollectedVideoInfo } from "../model/CollectedVideoInfo";
import { useUserHomeCollection } from "../composables/useUserHomeCollection";

const {
    count,
    pageNo,
    pageSize,
    videoList,
    loading,
    loadedOnce,
    loadCollection,
} = useUserHomeCollection()

const sectionRef = useTemplateRef<HTMLElement>('sectionRef')

/** 「UP 主 · 收藏于 N 天前」 */
function collectMeta(video: CollectedVideoInfo)
{
    const creator = (video.briefUserInfo ?? video.userInfo)?.nickName
    const collected = formatRelativeDay(video.collectDate)
    return [creator, collected && `收藏于 ${collected}`].filter(Boolean).join(' · ')
}

async function changePage(newPageNo: number)
{
    sectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    await loadCollection(newPageNo)
}
</script>

<template>
    <div ref="sectionRef" class="collection-anchor">
        <GlassSection title="收藏" :count="loadedOnce ? formatCount(count) : null">
            <div v-if="!loadedOnce" class="video-grid" aria-busy="true">
                <GlassVideoSkeleton :count="10" />
            </div>
            <GlassEmpty v-else-if="videoList.length === 0" title="还没有收藏视频" />
            <div v-else :class="['video-grid', { refreshing: loading }]" :aria-busy="loading">
                <GlassVideoCard v-for="(videoItem, index) in videoList" :key="videoItem.videoId ?? index"
                    :video="videoItem" :meta="collectMeta(videoItem)" />
            </div>

            <GlassPagination v-if="pageSize > 0 && count > pageSize" :total="count" :page-size="pageSize"
                :current-page="pageNo" @change="changePage" />
        </GlassSection>
    </div>
</template>

<style lang="scss" scoped>
.collection-anchor {
    scroll-margin-top: 104px;
}

.video-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 14px;
    transition: opacity 0.2s;

    &.refreshing {
        opacity: 0.5;
        pointer-events: none;
    }
}
</style>
