<script lang="ts" setup>
import { Search } from "@element-plus/icons-vue";
import DanmakuTable from "./DanmakuTable.vue";
import { useDanmakuManagement } from "../composables/useDanmakuManagement";

const {
  searchKeyword,
  danmakuCount,
  danmakuList,
  currentPage,
  pageSize,
  loading,
  handleSearch,
  handlePageNoChange,
  handlePageSizeChange,
  handleDanmakuDeleted,
} = useDanmakuManagement();
</script>

<template>
  <div class="danmaku-management">
    <el-card class="filter-card" shadow="never">
      <div class="filter-row">
        <div class="filter-title">
          弹幕管理
          <span v-if="danmakuCount > 0" class="count-text">({{ danmakuCount }})</span>
        </div>
        <div class="filter-actions">
          <el-input
            v-model="searchKeyword"
            :suffix-icon="Search"
            placeholder="搜索视频名称"
            clearable
            class="filter-input"
            @keyup.enter="handleSearch"
          />
          <el-button type="primary" @click="handleSearch">查询</el-button>
        </div>
      </div>
    </el-card>

    <el-card class="table-card" shadow="never">
      <DanmakuTable
        :danmaku-list="danmakuList"
        :total-count="danmakuCount"
        :loading="loading"
        :current-page="currentPage"
        :page-size="pageSize"
        @change-page-no="handlePageNoChange"
        @change-page-size="handlePageSizeChange"
        @danmaku-deleted="handleDanmakuDeleted"
      />
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.danmaku-management {
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
