<script lang="ts" setup>
import { computed } from 'vue';
import CcPageHeader from '@/pages/creativeCenter/shared/ui/CcPageHeader.vue';
import CcSearchPill from '@/pages/creativeCenter/shared/ui/CcSearchPill.vue';
import CcVideoFilterChip from '@/pages/creativeCenter/shared/ui/CcVideoFilterChip.vue';
import CcEmpty from '@/pages/creativeCenter/shared/ui/CcEmpty.vue';
import CcPager from '@/pages/creativeCenter/shared/ui/CcPager.vue';
import message from '@/shared/lib/message';
import VideoCommentTable from './VideoCommentTable.vue';
import { COMMENT_PAGE_SIZE, useVideoCommentManagement } from '../model/useVideoCommentManagement';

const {
    hasVideoId,
    searchKeyword,
    appliedKeyword,
    commentCount,
    commentList,
    listLoaded,
    currentPage,
    deletingIds,
    filterVideo,
    handleKeywordInput,
    handleSearch,
    handlePageNoChange,
    clearVideoFilter,
    deleteComment,
} = useVideoCommentManagement();

const emptyState = computed(() =>
{
    if (hasVideoId.value)
    {
        return { title: '这个视频还没有评论', sub: '点击右上角 × 查看全部视频' };
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

async function onDelete(commentId: string)
{
    const ok = await deleteComment(commentId);
    if (ok)
    {
        message.success('删除成功');
    }
}
</script>

<template>
    <div class="cc-page">
        <CcPageHeader title="评论管理" :count="commentCount">
            <CcVideoFilterChip v-if="hasVideoId" :title="filterVideo.title" :cover="filterVideo.cover"
                @clear="clearVideoFilter" />
            <CcSearchPill v-else :model-value="searchKeyword" placeholder="搜索视频名称"
                @update:model-value="handleKeywordInput" @search="handleSearch" />
        </CcPageHeader>

        <section class="list-panel" aria-label="评论列表">
            <VideoCommentTable :comment-list="commentList" :deleting-ids="deletingIds" @delete="onDelete" />
            <CcEmpty v-if="listLoaded && commentList.length === 0" :title="emptyState.title" :sub="emptyState.sub" />
            <CcPager :model-value="currentPage" :total="commentCount ?? 0" :page-size="COMMENT_PAGE_SIZE"
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
