<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { VueDraggable } from 'vue-draggable-plus';
import confirm from '@/shared/lib/confirm';
import { formatBackendDateTime, formatRelativeDay } from '@/shared/utils/DateUtil';
import SerieItem from '@/pages/userHome/shared/ui/SerieItem.vue';
import GlassSection from '@/pages/userHome/shared/ui/GlassSection.vue';
import GlassVideoCard from '@/pages/userHome/shared/ui/GlassVideoCard.vue';
import GlassVideoSkeleton from '@/pages/userHome/shared/ui/GlassVideoSkeleton.vue';
import GlassEmpty from '@/pages/userHome/shared/ui/GlassEmpty.vue';
import VideoSeriesEditor from '@/pages/userHome/features/videoSeriesEditor/ui/VideoSeriesEditor.vue';
import type { VideoSeriesInfo } from '@/pages/userHome/shared/model/VideoSeriesInfo';
import type { VideoInfo } from '@/shared/model/VideoInfo';
import { useHomeVideoSeries } from '../composables/useHomeVideoSeries';

const route = useRoute()

const {
    maxSeriesNumber,
    maxVideosNumber,
    isMySelf,
    seriesList,
    seriesLoaded,
    videosLoaded,
    canDrag,
    dragging,
    dialogVisible,
    viewSerieMode,
    currentSerieInfo,
    videoList,
    videoCount,
    draggingTmpVideoList,
    draggingTmpSeriesList,
    resortSeries,
    resortSeriesVideos,
    deleteSeries,
    deleteSeriesVideo,
    saveSerie,
    startDragging,
    endDragging,
} = useHomeVideoSeries()

function getSerieRoute(seriesId: string | null | undefined)
{
    return {
        name: 'userVideoSeries',
        params: {
            userId: route.params.userId,
            seriesId: seriesId ?? '',
        },
    }
}

/** 列表视图能不能排序、能不能新建 */
const canSortSeries = computed(() => canDrag.value && !dragging.value && seriesList.value.length > 1)
const canAddSeries = computed(() => canDrag.value && !dragging.value && seriesList.value.length < maxSeriesNumber.value)
/** 详情视图能不能排序 */
const canSortVideos = computed(() => canDrag.value && !dragging.value && videoList.value.length > 1)

const seriesDescription = computed(() => currentSerieInfo.value?.seriesDescription || '暂无简介')
const seriesUpdated = computed(() => formatBackendDateTime(currentSerieInfo.value?.updateTime))

function confirmDeleteSeries(series: VideoSeriesInfo)
{
    confirm({
        message: `确定删除系列「${series.seriesName ?? ''}」吗？系列里的视频不会被删除。`,
        confirmText: '删除',
        confirmFun: () => deleteSeries(series.seriesId),
    })
}

function confirmRemoveVideo(video: VideoInfo)
{
    const name = (video.videoName ?? '').replace(/<[^>]*>/g, '')
    confirm({
        message: `确定把「${name}」移出这个系列吗？`,
        confirmText: '移出',
        confirmFun: () => deleteSeriesVideo(video.videoId),
    })
}

function confirmReorder()
{
    if (viewSerieMode.value) resortSeriesVideos()
    else resortSeries()
}
</script>

<template>
    <VideoSeriesEditor :visible="dialogVisible" :series-id="currentSerieInfo?.seriesId ?? undefined"
        :title="currentSerieInfo?.seriesName ?? undefined"
        :description="currentSerieInfo?.seriesDescription ?? undefined"
        :existed-video-list="videoList.map(videoInfo => videoInfo.videoId) as string[]"
        :max-videos-number="maxVideosNumber" @update:visible="newVal => dialogVisible = newVal" @submit="saveSerie" />

    <GlassSection v-if="!viewSerieMode" title="系列" :count="seriesLoaded ? `(${seriesList.length}/${maxSeriesNumber})` : null"
        mono-count>
        <template v-if="isMySelf" #actions>
            <template v-if="dragging">
                <span class="reorder-hint">拖拽卡片调整顺序</span>
                <button type="button" class="chip-button" @click="endDragging">取消</button>
                <button type="button" class="confirm-button" @click="confirmReorder">确认</button>
            </template>
            <button v-else-if="canSortSeries" type="button" class="chip-button" @click="startDragging">
                <span class="sort-mark" aria-hidden="true">⇅</span>排序
            </button>
        </template>

        <div v-if="!seriesLoaded" class="card-grid folders" aria-busy="true">
            <GlassVideoSkeleton :count="5" />
        </div>

        <!-- 排序中：整张卡片可拖动 -->
        <VueDraggable v-else-if="dragging" v-model="draggingTmpSeriesList" class="card-grid folders"
            :animation="180" ghost-class="drag-ghost" chosen-class="drag-chosen">
            <SerieItem v-for="(serieItem, index) in draggingTmpSeriesList" :key="serieItem.seriesId ?? index"
                :video-series-info="serieItem" reordering />
        </VueDraggable>

        <div v-else-if="seriesList.length > 0 || canAddSeries" class="card-grid folders">
            <button v-if="canAddSeries" type="button" class="add-card" @click="dialogVisible = true">
                <span class="add-mark" aria-hidden="true">+</span>
                <span class="add-text">添加系列</span>
            </button>
            <RouterLink v-for="(serieItem, index) in seriesList" :key="serieItem.seriesId ?? index"
                class="serie-link" :to="getSerieRoute(serieItem.seriesId)">
                <SerieItem :video-series-info="serieItem" :removable="isMySelf"
                    @remove="confirmDeleteSeries(serieItem)" />
            </RouterLink>
        </div>

        <GlassEmpty v-else title="还没有创建系列" />
    </GlassSection>

    <GlassSection v-else :count="currentSerieInfo ? `(${videoCount}/${maxVideosNumber})` : null" mono-count
        :gap="20">
        <template #title>
            <RouterLink :to="getSerieRoute(null)" class="back-button">← 全部系列</RouterLink>
            <h2 class="detail-title">{{ currentSerieInfo?.seriesName }}</h2>
        </template>
        <template v-if="isMySelf" #actions>
            <template v-if="dragging">
                <span class="reorder-hint">拖拽卡片调整顺序</span>
                <button type="button" class="chip-button" @click="endDragging">取消</button>
                <button type="button" class="confirm-button" @click="confirmReorder">确认</button>
            </template>
            <button v-else-if="canSortVideos" type="button" class="chip-button" @click="startDragging">
                <span class="sort-mark" aria-hidden="true">⇅</span>排序
            </button>
        </template>

        <div v-if="currentSerieInfo" class="detail-description">
            <span class="description-text">{{ seriesDescription }}</span>
            <span v-if="seriesUpdated" class="description-updated">更新于 <span class="mono">{{ seriesUpdated }}</span></span>
        </div>

        <div v-if="!videosLoaded" class="card-grid" aria-busy="true">
            <GlassVideoSkeleton :count="5" />
        </div>

        <VueDraggable v-else-if="dragging" v-model="draggingTmpVideoList" class="card-grid" :animation="180"
            ghost-class="drag-ghost" chosen-class="drag-chosen">
            <GlassVideoCard v-for="(videoItem, index) in draggingTmpVideoList" :key="videoItem.videoId ?? index"
                :video="videoItem" :meta="formatRelativeDay(videoItem.lastUpdateTime ?? videoItem.createTime)"
                reordering />
        </VueDraggable>

        <div v-else-if="videoList.length > 0 || canDrag" class="card-grid">
            <button v-if="canDrag" type="button" class="add-card" @click="dialogVisible = true">
                <span class="add-mark" aria-hidden="true">+</span>
                <span class="add-text">修改系列 & 添加视频</span>
            </button>
            <GlassVideoCard v-for="(videoItem, index) in videoList" :key="videoItem.videoId ?? index"
                :video="videoItem" :meta="formatRelativeDay(videoItem.lastUpdateTime ?? videoItem.createTime)"
                :removable="isMySelf" remove-label="移出系列" @remove="confirmRemoveVideo(videoItem)" />
        </div>

        <GlassEmpty v-else title="这个系列还没有视频" />
    </GlassSection>
</template>

<style lang="scss" scoped>
@use '@/pages/userHome/shared/styles/glass' as *;

.card-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 14px;

    // 文件夹卡片上面有叠层，行距留大一点
    &.folders {
        gap: 18px 14px;
    }
}

.serie-link {
    display: block;
    min-width: 0;
    color: inherit;
    text-decoration: none;
}

.chip-button {
    @include glass-chip-button(38px);
    padding: 0 16px;

    .sort-mark {
        font-size: 14px;
        line-height: 1;
    }
}

.confirm-button {
    @include accent-button(38px);
    padding: 0 20px;
    font-size: 13px;
    box-shadow: 0 12px 24px -12px rgba(0, 0, 242, 0.7);
}

.reorder-hint {
    margin-right: 6px;
    font-size: 13px;
    color: $warm-ink-3;
}

// 虚线卡片：新建系列 / 修改系列
.add-card {
    @include reset-button;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    min-height: 100%;
    padding: 24px 8px;
    border: 1.5px dashed rgba(11, 12, 18, 0.22);
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.28);
    transition: background-color 0.2s;

    &:hover {
        background: rgba(255, 255, 255, 0.6);
    }

    .add-mark {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: $warm-accent;
        color: #FFFFFF;
        font-size: 24px;
        font-weight: 300;
        line-height: 1;
        box-shadow: 0 12px 24px -12px rgba(0, 0, 242, 0.7);
    }

    .add-text {
        font-size: 14px;
        font-weight: 600;
        color: $warm-ink-2;
    }
}

/*——————系列详情—————— */

.back-button {
    @include glass-chip-button(36px);
    flex-shrink: 0;
    align-self: center;
    color: $warm-ink;
    text-decoration: none;
}

.detail-title {
    margin: 0;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.015em;
}

.detail-description {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 0 4px 18px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.7);
    font-size: 14px;
    color: $warm-ink-2;

    .description-text {
        flex: 1;
        min-width: 0;
        line-height: 1.7;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        text-wrap: pretty;
    }

    .description-updated {
        flex-shrink: 0;
        font-size: 12px;
        color: $warm-ink-3;

        .mono {
            font-family: $warm-font-mono;
        }
    }
}

/*——————拖拽—————— */

:deep(.drag-ghost) {
    opacity: 0.35;
}

:deep(.drag-chosen) {
    cursor: grabbing;
}
</style>
