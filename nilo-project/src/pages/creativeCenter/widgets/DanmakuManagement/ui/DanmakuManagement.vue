<script lang="ts" setup>
import { computed } from 'vue';
import CcPageHeader from '@/pages/creativeCenter/shared/ui/CcPageHeader.vue';
import CcSearchPill from '@/pages/creativeCenter/shared/ui/CcSearchPill.vue';
import CcVideoFilterChip from '@/pages/creativeCenter/shared/ui/CcVideoFilterChip.vue';
import CcEmpty from '@/pages/creativeCenter/shared/ui/CcEmpty.vue';
import CcPager from '@/pages/creativeCenter/shared/ui/CcPager.vue';
import message from '@/shared/lib/message';
import DanmakuTable from './DanmakuTable.vue';
import { DANMAKU_PAGE_SIZE, useDanmakuManagement } from '../model/useDanmakuManagement';

const {
    fileIndex,
    hasVideoId,
    searchKeyword,
    appliedKeyword,
    danmakuCount,
    danmakuList,
    listLoaded,
    currentPage,
    deletingIds,
    filterVideo,
    handleKeywordInput,
    handleSearch,
    handlePageNoChange,
    clearVideoFilter,
    deleteDanmaku,
} = useDanmakuManagement();

const emptyState = computed(() =>
{
    if (hasVideoId.value)
    {
        return { title: '这个视频还没有弹幕', sub: '点击右上角 × 查看全部视频' };
    }
    if (appliedKeyword.value)
    {
        return { title: '没有找到相关视频', sub: '换个关键词试试' };
    }
    return { title: '这里还没有内容', sub: undefined };
});

// 翻页后回到页面最顶端
function onPageChange(pageNo: number)
{
    handlePageNoChange(pageNo);
    window.scrollTo(0, 0);
}

async function onDelete(danmakuId: string)
{
    const ok = await deleteDanmaku(danmakuId);
    if (ok)
    {
        message.success('删除成功');
    }
}
</script>

<template>
    <div class="cc-page">
        <CcPageHeader title="弹幕管理" :count="danmakuCount">
            <CcVideoFilterChip v-if="hasVideoId" :title="filterVideo.title" :cover="filterVideo.cover"
                :part="fileIndex ?? null" @clear="clearVideoFilter" />
            <CcSearchPill v-else :model-value="searchKeyword" placeholder="搜索视频名称"
                @update:model-value="handleKeywordInput" @search="handleSearch" />
        </CcPageHeader>

        <section class="list-panel" aria-label="弹幕列表">
            <DanmakuTable :danmaku-list="danmakuList" :deleting-ids="deletingIds" @delete="onDelete" />
            <CcEmpty v-if="listLoaded && danmakuList.length === 0" :title="emptyState.title" :sub="emptyState.sub" />
            <CcPager :model-value="currentPage" :total="danmakuCount ?? 0" :page-size="DANMAKU_PAGE_SIZE"
                @update:model-value="onPageChange" />
        </section>
    </div>
</template>

<style lang="scss" scoped>
@use '@/pages/creativeCenter/shared/styles/cc' as *;

.list-panel {
    @include panel(24px 28px 28px);
    display: flex;
    flex-direction: column;
}
</style>
