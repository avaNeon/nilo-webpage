<script lang="ts" setup>
import { Search } from "@element-plus/icons-vue";
import CommentTable from "./CommentTable.vue";
import { useCommentManagement } from "../composables/useCommentManagement";

const {
    searchKeyword,
    commentCount,
    commentList,
    currentPage,
    pageSize,
    loading,
    handleSearch,
    handlePageNoChange,
    handlePageSizeChange,
    handleCommentDeleted,
} = useCommentManagement();
</script>

<template>
    <div class="comment-management">
        <el-card class="filter-card" shadow="never">
            <div class="filter-row">
                <div class="filter-title">
                    评论管理
                    <span v-if="commentCount > 0" class="count-text">({{ commentCount }})</span>
                </div>
                <div class="filter-actions">
                    <el-input v-model="searchKeyword" :suffix-icon="Search" placeholder="搜索视频名称" clearable
                        class="filter-input" @keyup.enter="handleSearch" />
                    <el-button type="primary" @click="handleSearch">查询</el-button>
                </div>
            </div>
        </el-card>

        <el-card class="table-card" shadow="never">
            <CommentTable :comment-list="commentList" :total-count="commentCount" :loading="loading"
                :current-page="currentPage" :page-size="pageSize" @change-page-no="handlePageNoChange"
                @change-page-size="handlePageSizeChange" @comment-deleted="handleCommentDeleted" />
        </el-card>
    </div>
</template>

<style lang="scss" scoped>
.comment-management {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;

    .filter-card {
        :deep(.el-card__body) {
            padding: 16px 20px;
        }

        .filter-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            flex-wrap: wrap;
        }

        .filter-title {
            font-size: 18px;
            font-weight: 500;
            color: $color-text-primary;
            white-space: nowrap;

            .count-text {
                font-size: 16px;
                font-weight: 400;
                color: $color-text-secondary;
            }
        }

        .filter-actions {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
        }

        .filter-input {
            width: 300px;
        }
    }

    .table-card {
        :deep(.el-card__body) {
            padding: 0;
        }
    }
}
</style>
