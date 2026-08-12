<script lang="ts" setup>
import { computed } from "vue";
import { ElMessageBox } from "element-plus";
import type { Danmaku } from "@/pages/index/widgets/interaction/danmaku/model/Danmaku";
import { DanmakuApi } from "@/pages/index/widgets/interaction/danmaku/api/DanmakuApi";
import message from "@/shared/lib/message";
import { formatPostTime } from "@/shared/utils/DateUtil";

const emit = defineEmits<{
  (e: "changePageNo", pageNo: number): void;
  (e: "changePageSize", pageSize: number): void;
  (e: "danmakuDeleted", danmakuId: string): void;
}>();

const props = withDefaults(
  defineProps<{
    danmakuList: Danmaku[];
    totalCount: number;
    loading?: boolean;
    showPagination?: boolean;
    currentPage: number;
    pageSize: number;
  }>(),
  {
    loading: false,
    showPagination: true,
  },
);

/** 避免分页组件在 props 未就绪时出现异常 */
const localTotalCount = computed(() => Number(props.totalCount ?? 0));
const localCurrentPage = computed(() => Math.max(1, Number(props.currentPage ?? 1)));
const localPageSize = computed(() => Math.max(1, Number(props.pageSize ?? 10)));

function handlePageSizeChange(size: number)
{
  emit("changePageSize", size);
}

function handlePageNoChange(newPageNo: number)
{
  emit("changePageNo", newPageNo);
}

/** 毫秒转可读播放时刻 */
function formatDisplayMoment(ms: number | null | undefined): string
{
  if (ms === null || ms === undefined) return "-";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0)
  {
    return `${minutes}分${seconds}秒`;
  }
  return `${seconds}秒`;
}

/** 弹幕展示位置：0-滚动 1-顶部 2-底部 */
function formatPosition(pos: number | null | undefined): string
{
  if (pos === null || pos === undefined) return "-";
  switch (pos)
  {
    case 0:
      return "滚动";
    case 1:
      return "顶部";
    case 2:
      return "底部";
    default:
      return String(pos);
  }
}

/** 视频名称 + 分P 序号展示文本 */
function getVideoInfoText(row: Danmaku): string
{
  const name = row.videoName ?? "未知视频";
  const idx = row.fileIndex != null ? `P${row.fileIndex}` : "";
  return idx ? `${name} - ${idx}` : name;
}

/** 打开前台视频详情页（新标签），有分P时带上 index */
function goToVideo(row: Danmaku)
{
  if (!row.videoId) return;
  const indexPart =
    row.fileIndex != null && row.fileIndex !== undefined
      ? `/${row.fileIndex}`
      : "";
  window.open(`/video/${row.videoId}${indexPart}`, "_blank");
}

/** 删除弹幕：弹窗二次确认后调用接口 */
async function handleDeleteClick(row: Danmaku)
{
  try
  {
    await ElMessageBox.confirm("确定要删除该弹幕吗？", "删除确认", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    });
  } catch
  {
    return;
  }

  const result = await DanmakuApi.deleteDanmaku(row.danmakuId);
  if (result && result.code === 200)
  {
    message.success("删除成功");
    emit("danmakuDeleted", row.danmakuId);
  }
}
</script>

<template>
  <div class="danmaku-table">
    <el-table v-loading="loading" :data="danmakuList || []" style="width: 100%" stripe border size="large"
      row-key="danmakuId" highlight-current-row>
      <el-table-column label="发送者" align="center" width="120">
        <template #default="{ row }">
          <span class="user-name">{{ row.nickName }}</span>
        </template>
      </el-table-column>

      <el-table-column label="展示信息" align="center" width="150">
        <template #default="{ row }">
          <div class="display-info-cell">
            <span class="display-moment">{{ formatDisplayMoment(row.displayMoment) }}</span>
            <span class="display-position">{{ formatPosition(row.position) }}</span>
            <span class="display-color">
              <span class="color-dot" :style="{ backgroundColor: row.color || '#fff' }" />
              {{ row.color ?? "-" }}
            </span>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="弹幕内容" align="left" min-width="320">
        <template #default="{ row }">
          <span class="danmaku-content">{{ row.content }}</span>
        </template>
      </el-table-column>

      <el-table-column label="视频信息" align="center" width="200">
        <template #default="{ row }">
          <span class="video-link" @click="goToVideo(row)">
            {{ getVideoInfoText(row) }}
          </span>
        </template>
      </el-table-column>

      <el-table-column label="发送时间" align="center" width="160">
        <template #default="{ row }">
          <span class="post-time">{{ formatPostTime(row.postTime) }}</span>
        </template>
      </el-table-column>

      <el-table-column label="操作" align="center" width="100" fixed="right">
        <template #default="{ row }">
          <span class="delete-btn" @click="handleDeleteClick(row)">删除</span>
        </template>
      </el-table-column>
    </el-table>

    <div v-if="showPagination" class="pagination-wrapper">
      <el-pagination background :total="localTotalCount" :page-sizes="[3, 5, 7, 10]" :page-size="localPageSize"
        :current-page="localCurrentPage" layout="total, sizes, prev, pager, next, jumper"
        @size-change="handlePageSizeChange" @current-change="handlePageNoChange" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.danmaku-table {
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

      &:hover {
        background-color: #f8faff !important;
      }
    }

    .el-table__cell {
      padding: 12px 0;
    }
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 16px 20px;
}

.user-name {
  color: $color-bilibili-blue;
  font-weight: 500;
  font-size: 13px;
}

.display-info-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  row-gap: 4px;

  .display-moment {
    font-size: 13px;
    color: $color-text-primary;
    font-weight: 500;
  }

  .display-position {
    font-size: 12px;
    color: $color-text-secondary;
  }

  .display-color {
    display: flex;
    align-items: center;
    column-gap: 4px;
    font-size: 12px;
    color: $color-text-secondary;

    .color-dot {
      display: inline-block;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 1px solid #ddd;
    }
  }
}

.danmaku-content {
  font-size: 14px;
  color: $color-text-primary;
  word-break: break-word;
  white-space: pre-wrap;
  padding: 0 12px;
}

.video-link {
  color: $color-bilibili-blue;
  cursor: pointer;
  font-size: 13px;

  &:hover {
    text-decoration: underline;
  }
}

.post-time {
  font-size: 13px;
  color: $color-text-secondary;
}

.delete-btn {
  color: $color-bilibili-blue;
  cursor: pointer;
  font-size: 13px;

  &:hover {
    text-decoration: underline;
  }
}
</style>
