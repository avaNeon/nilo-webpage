<script lang="ts" setup>
import { useRoute } from 'vue-router';
import { formatRelativeDay } from '@/shared/utils/DateUtil';
import GlassSection from '@/pages/userHome/shared/ui/GlassSection.vue';
import GlassVideoCard from '@/pages/userHome/shared/ui/GlassVideoCard.vue';
import GlassEmpty from '@/pages/userHome/shared/ui/GlassEmpty.vue';
import { useUserHomeSeries } from '../model/useUserHomeSeries';

const { visibleSeries, hasSeries, loading } = useUserHomeSeries()

const route = useRoute()

function seriesRoute(seriesId: string | null)
{
    return { name: 'userVideoSeries', params: { userId: route.params.userId, seriesId } }
}
</script>

<template>
    <!-- 加载中不占位，免得和上面的视频骨架屏一起闪 -->
    <GlassSection v-if="!loading" title="系列" :count="hasSeries ? visibleSeries.length : null" :gap="16">
        <template v-if="hasSeries">
            <div v-for="(series, index) in visibleSeries" :key="series.seriesId ?? index" class="series-row">
                <div class="row-head">
                    <div class="row-title">
                        <span class="row-no">{{ String(index + 1).padStart(2, '0') }}</span>
                        <RouterLink v-if="series.seriesId" :to="seriesRoute(series.seriesId)" class="row-name">
                            {{ series.seriesName }}
                        </RouterLink>
                        <span v-else class="row-name">{{ series.seriesName }}</span>
                        <span class="row-count">{{ series.videoCount ?? series.videoInfoList.length }} 个视频</span>
                    </div>
                    <RouterLink v-if="series.seriesId" :to="seriesRoute(series.seriesId)" class="more-link">
                        查看全部 →
                    </RouterLink>
                </div>
                <div class="row-grid">
                    <GlassVideoCard v-for="(video, videoIndex) in series.videoInfoList"
                        :key="video.videoId ?? videoIndex" :video="video" compact
                        :meta="formatRelativeDay(video.lastUpdateTime ?? video.createTime)" />
                </div>
            </div>
        </template>
        <GlassEmpty v-else title="还没有系列" />
    </GlassSection>
</template>

<style lang="scss" scoped>
@use '@/pages/userHome/shared/styles/glass' as *;

.series-row {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 20px 20px 22px;
    border-radius: 28px;
    background: rgba(255, 255, 255, 0.42);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9), inset 0 0 0 1px rgba(255, 255, 255, 0.4);
}

.row-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
}

.row-title {
    display: flex;
    align-items: baseline;
    gap: 10px;
    min-width: 0;

    .row-no {
        flex-shrink: 0;
        font-family: $warm-font-mono;
        font-size: 12px;
        color: $warm-accent;
    }

    .row-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 18px;
        font-weight: 700;
        color: $warm-ink;
        text-decoration: none;
        transition: color 0.2s;
    }

    a.row-name:hover {
        color: $warm-accent;
    }

    .row-count {
        flex-shrink: 0;
        font-size: 13px;
        color: $warm-ink-3;
    }
}

.more-link {
    @include glass-chip-button;
    flex-shrink: 0;
    color: $warm-accent;
    text-decoration: none;
}

.row-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 14px;
}
</style>
