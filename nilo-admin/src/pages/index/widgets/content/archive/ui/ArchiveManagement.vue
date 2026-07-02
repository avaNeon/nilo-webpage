<script lang="ts" setup>
import { PictureFilled, Search } from "@element-plus/icons-vue";
import { useArchiveManagement } from "../composables/useArchiveManagement";
import { getDeleterTypeLabel, getDeleterTypeClass } from "../model/enum/DeleterTypeEnum";
import { imgRequestUrl } from "@/shared/utils/ImgUtil";
import VideoPlayerDialog from "@/pages/index/entities/videoPlayerDialog/ui/VideoPlayerDialog.vue";
import { getArchiveHlsMasterUrl } from "@/pages/index/entities/videoPlayerDialog/model/hlsUrl";

const {
  flatCategoryOptions,
  searchKeyword,
  cascaderValue,
  onCategoryChange,
  selectedDeleterType,
  deleterTypeOptions,
  handleSortChange,
  videoList,
  currentPage,
  pageSize,
  totalCount,
  loading,
  handleSearch,
  handleSizeChange,
  handlePageChange,
  handleRecover,
  handleDelete,
  previewVisible,
  previewVideoInfo,
  previewFileList,
  openPreview,
} = useArchiveManagement();
</script>

<template>
  <div class="archive-management">
    <!-- ─── 筛选区 ─── -->
    <el-card class="filter-card" shadow="never">
      <div class="filter-row">
        <el-input v-model="searchKeyword" :suffix-icon="Search" placeholder="搜索视频名称" clearable class="filter-input"
          @keyup.enter="handleSearch" />
        <el-cascader v-model="cascaderValue" :options="flatCategoryOptions"
          :props="{ checkStrictly: true, emitPath: true }" placeholder="选择分类" clearable class="filter-cascader"
          @change="onCategoryChange" />
        <el-select v-model="selectedDeleterType" placeholder="删除类型" clearable class="filter-select">
          <el-option v-for="opt in deleterTypeOptions" :key="String(opt.value ?? 'all')" :label="opt.label"
            :value="opt.value" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
      </div>
    </el-card>

    <!-- ─── 表格区 ─── -->
    <el-card class="table-card" shadow="never">
      <el-table v-loading="loading" :data="videoList" style="width: 100%" stripe border size="large" row-key="videoId"
        @sort-change="handleSortChange" @row-click="openPreview">
        <!-- 封面 -->
        <el-table-column label="封面" width="160" align="center">
          <template #default="{ row }">
            <el-image :src="imgRequestUrl(row.videoCover)" fit="cover" class="cover-img">
              <template #error>
                <div class="cover-placeholder">
                  <el-icon>
                    <PictureFilled />
                  </el-icon>
                </div>
              </template>
            </el-image>
          </template>
        </el-table-column>

        <!-- 视频信息 -->
        <el-table-column label="视频信息" min-width="280">
          <template #default="{ row }">
            <div class="video-info-cell">
              <div class="video-name" :title="row.videoName">
                {{ row.videoName }}
              </div>
              <div class="video-author">
                <span class="author-name iconfont icon-upzhu">{{ row.nickName }}</span>
              </div>
              <div class="video-stats">
                <span class="stat-item" title="播放数">
                  <i class="iconfont icon-play2"></i>{{ row.playCount ?? "-" }}
                </span>
                <span class="stat-item" title="点赞数">
                  <i class="iconfont icon-like-solid"></i>{{ row.likeCount ?? "-" }}
                </span>
                <span class="stat-item" title="弹幕数">
                  <i class="iconfont icon-danmu"></i>{{ row.danmakuCount ?? "-" }}
                </span>
                <span class="stat-item" title="评论数">
                  <i class="iconfont icon-Chat-1"></i>{{ row.commentCount ?? "-" }}
                </span>
                <span class="stat-item" title="投币数">
                  <i class="iconfont icon-toubi"></i>{{ row.coinCount ?? "-" }}
                </span>
                <span class="stat-item" title="收藏数">
                  <i class="iconfont icon-collection-solid"></i>{{ row.collectCount ?? "-" }}
                </span>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 删除时间 -->
        <el-table-column label="时间" prop="deleteTime" sortable="custom" :sort-orders="['descending', 'ascending', null]"
          width="280" align="center">
          <template #default="{ row }">
            <div class="time-cell">
              <div class="time-row">
                <span class="time-label">删除时间</span>
                <span class="time-value">{{ row.deleteTime }}</span>
              </div>
              <div class="time-row">
                <span class="time-label">创建时间</span>
                <span class="time-value">{{ row.createTime }}</span>
              </div>
              <div class="time-row">
                <span class="time-label">最后修改时间</span>
                <span class="time-value">{{ row.lastUpdateTime }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 删除类型 -->
        <el-table-column label="删除类型" width="110" align="center">
          <template #default="{ row }">
            <span :class="['deleter-tag', getDeleterTypeClass(row.deleterType)]">
              {{ getDeleterTypeLabel(row.deleterType) }}
            </span>
          </template>
        </el-table-column>

        <!-- 操作 -->
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <div class="action-btns" @click.stop>
              <el-button type="primary" size="small" link @click="handleRecover(row)">
                恢复
              </el-button>
              <el-button type="danger" size="small" link @click="handleDelete(row)">
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="totalCount"
          :page-sizes="[5, 10, 15, 20]" layout="total, sizes, prev, pager, next, jumper" background
          @size-change="handleSizeChange" @current-change="handlePageChange" />
      </div>
    </el-card>

    <!-- 预览弹窗 -->
    <VideoPlayerDialog v-model:visible="previewVisible" :video-info="previewVideoInfo ?? {}"
      :file-list="previewFileList" :get-master-url="getArchiveHlsMasterUrl" />
  </div>
</template>

<style lang="scss" scoped>
.archive-management {
  padding: 20px;

  /* ─── 筛选区 ─── */
  .filter-card {
    margin-bottom: 16px;

    :deep(.el-card__body) {
      padding: 16px 20px;
    }

    .filter-row {
      display: flex;
      align-items: center;
      gap: 16px;

      .filter-input {
        width: 260px;
      }

      .filter-cascader {
        width: 220px;
      }

      .filter-select {
        width: 140px;
      }
    }
  }

  /* ─── 表格 ─── */
  .table-card {
    :deep(.el-card__body) {
      padding: 0;
    }

    :deep(.el-table) {
      thead th.el-table__cell {
        background-color: #f7f8fa;
        font-weight: 700;
        color: $color-text-primary;
        font-size: 13px;
        border-bottom: 2px solid $color-border;
      }

      .el-table__row {
        transition: background-color 0.2s;
        cursor: pointer;

        &:hover {
          background-color: #f8faff !important;
        }
      }

      .el-table__cell {
        padding: 12px 0;
      }
    }
  }

  /* ─── 封面 ─── */
  .cover-img {
    width: 120px;
    height: 75px;
    border-radius: 6px;
    display: inline-block;

    :deep(img) {
      object-fit: cover;
      border-radius: 6px;
    }
  }

  .cover-placeholder {
    width: 120px;
    height: 75px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: $color-surface;
    border-radius: 6px;
    color: $color-text-muted;
    font-size: 24px;
  }

  /* ─── 视频信息 ─── */
  .video-info-cell {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .video-name {
      font-size: 15px;
      font-weight: 500;
      color: $color-text-primary;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .video-author {
      .author-name {
        font-size: 14px;
        color: $color-text-muted;
      }

      .iconfont::before {
        margin-right: 5px;
      }
    }

    .video-stats {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      .stat-item {
        font-size: 12px;
        color: $color-text-secondary;

        .iconfont {
          font-size: 12px;
          margin-right: 2px;

          &::first-letter {
            margin-right: 1px;
          }
        }
      }
    }
  }

  /* ─── 时间列 ─── */
  .time-cell {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;

    .time-row {
      display: flex;
      gap: 6px;
      align-items: center;

      .time-label {
        color: $color-text-muted;
        flex-shrink: 0;
      }

      .time-value {
        color: $color-text-primary;
      }
    }
  }

  /* ─── 删除类型标签 ─── */
  .deleter-tag {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;

    &.deleter-user {
      color: $color-text-secondary;
      background-color: $color-mask-10;
    }

    &.deleter-admin {
      color: $color-bilibili-blue;
      background-color: $color-badge-blue-bg;
    }
  }

  /* ─── 操作按钮 ─── */
  .action-btns {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 4px;
  }

  /* ─── 分页 ─── */
  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    padding: 16px 20px;
  }
}
</style>
