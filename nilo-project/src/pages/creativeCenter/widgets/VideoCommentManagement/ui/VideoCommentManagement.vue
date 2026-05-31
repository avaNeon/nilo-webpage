<script lang="ts" setup>
import { Search } from '@element-plus/icons-vue';
import VideoCommentTable from './VideoCommentTable.vue';
import { useVideoCommentManagement } from '../model/useVideoCommentManagement';

const {
    searchKeyword,
    commentCount,
    commentList,
    currentPage,
    pageSize,
    hasVideoId,
    handlePageNoChange,
    handlePageSizeChange,
    handleCommentDeleted,
} = useVideoCommentManagement();
</script>

<template>
    <div id="comment-management-top" class="content">
        <div class="top">
            <div class="title">
                <span class="title-text">评论管理
                    <span class="count-text" v-if="commentCount > 0">({{ commentCount }})</span>
                </span>
            </div>
            <div class="search" v-if="!hasVideoId">
                <el-input :suffix-icon="Search" placeholder="搜索视频名称" v-model="searchKeyword"></el-input>
            </div>
        </div>
        <div class="main-content">
            <VideoCommentTable class="table" :comment-list="commentList" :total-count="commentCount" :show-pagination="true"
                :current-page="currentPage" :page-size="pageSize" @change-page-no="handlePageNoChange"
                @change-page-size="handlePageSizeChange" @comment-deleted="handleCommentDeleted" />
        </div>
    </div>
</template>

<style lang="scss" scoped>
.content {
    .top {
        margin: 30px 40px 20px;

        display: flex;
        justify-content: space-between;
        align-items: center;

        .title {
            .title-text {
                font-size: 18px;
                font-weight: 500;

                .count-text {
                    font-size: 16px;
                    font-weight: 400;
                    color: $color-text-secondary;
                }
            }
        }

        .search {
            width: 300px;
        }
    }

    .main-content {
        margin-top: 10px;
    }
}
</style>

