<script lang="ts" setup>
import { computed, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';
import { formatCount } from '@/shared/utils/NumberUtil';
import { formatRelativeDay } from '@/shared/utils/DateUtil';
import GlassSection from '@/pages/userHome/shared/ui/GlassSection.vue';
import GlassVideoCard from '@/pages/userHome/shared/ui/GlassVideoCard.vue';
import GlassVideoSkeleton from '@/pages/userHome/shared/ui/GlassVideoSkeleton.vue';
import GlassPagination from '@/pages/userHome/shared/ui/GlassPagination.vue';
import GlassEmpty from '@/pages/userHome/shared/ui/GlassEmpty.vue';
import { useUserHomeUpload } from '../composables/useUserHomeUpload';

const {
    SortTypes,
    sortTypeValue,
    searchKeyword,
    count,
    pageNo,
    pageSize,
    videoList,
    loading,
    loadedOnce,
    loadVideos,
    changeSortType,
} = useUserHomeUpload()

const router = useRouter()
const sectionRef = useTemplateRef<HTMLElement>('sectionRef')

const title = computed(() => searchKeyword.value ? `“${searchKeyword.value}”` : '全部投稿')

/** 翻页后回到列表开头 */
async function changePage(newPageNo: number)
{
    sectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    await loadVideos(newPageNo)
}

function clearKeyword()
{
    router.replace({ query: {} })
}
</script>

<template>
    <div ref="sectionRef" class="upload-anchor">
        <GlassSection :title="title" :count="loadedOnce ? formatCount(count) : null">
            <template #actions>
                <button v-if="searchKeyword" type="button" class="clear-button" @click="clearKeyword">
                    清除搜索
                </button>
                <div class="sort-bar" role="radiogroup" aria-label="投稿排序">
                    <button v-for="sortType in SortTypes" :key="sortType.value" type="button"
                        :class="['sort-item', { active: sortTypeValue === sortType.value }]" role="radio"
                        :aria-checked="sortTypeValue === sortType.value" @click="changeSortType(sortType.value)">
                        {{ sortType.label }}
                    </button>
                </div>
            </template>

            <div v-if="!loadedOnce" class="video-grid" aria-busy="true">
                <GlassVideoSkeleton :count="10" />
            </div>
            <GlassEmpty v-else-if="videoList.length === 0" :title="searchKeyword ? '没有找到相关视频' : '还没有发布视频'"
                :description="searchKeyword ? '换个关键词试试' : ''" />
            <div v-else :class="['video-grid', { refreshing: loading }]" :aria-busy="loading">
                <GlassVideoCard v-for="(videoItem, index) in videoList" :key="videoItem.videoId ?? index"
                    :video="videoItem" :meta="formatRelativeDay(videoItem.lastUpdateTime ?? videoItem.createTime)" />
            </div>

            <GlassPagination v-if="count > pageSize" :total="count" :page-size="pageSize" :current-page="pageNo"
                @change="changePage" />
        </GlassSection>
    </div>
</template>

<style lang="scss" scoped>
@use '@/pages/userHome/shared/styles/glass' as *;

// 翻页滚回来时停在顶栏下面
.upload-anchor {
    scroll-margin-top: 104px;
}

.sort-bar {
    display: flex;
    gap: 2px;
    padding: 4px;
    border-radius: 999px;
    @include glass-chip;
}

.sort-item {
    @include reset-button;
    display: flex;
    align-items: center;
    height: 32px;
    padding: 0 14px;
    border-radius: 999px;
    color: $warm-ink-2;
    font-size: 13px;
    font-weight: 500;
    transition: background-color 0.2s, color 0.2s;

    &:hover {
        color: $warm-accent;
    }

    &.active {
        background: #FFFFFF;
        color: $warm-accent;
        font-weight: 700;
    }
}

.clear-button {
    @include glass-chip-button;
    color: $warm-ink-3;
    font-weight: 500;
}

.video-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 14px;
    transition: opacity 0.2s;

    // 换排序/翻页时旧结果先变淡
    &.refreshing {
        opacity: 0.5;
        pointer-events: none;
    }
}
</style>
