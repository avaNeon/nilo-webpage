<script lang="ts" setup>
import { computed } from "vue";
import { PictureFilled } from "@element-plus/icons-vue";
import { ElMessageBox } from "element-plus";
import type { Comment } from "@/pages/index/widgets/interaction/comment/model/Comment";
import { CommentApi } from "@/pages/index/widgets/interaction/comment/api/CommentApi";
import { imgRequestUrl } from "@/shared/utils/ImgUtil";
import message from "@/shared/lib/message";
import { formatPostTime } from "@/shared/utils/DateUtil";
import Cover from "@/shared/ui/Cover.vue";

const emit = defineEmits<{
  (e: "changePageNo", pageNo: number): void;
  (e: "changePageSize", pageSize: number): void;
  (e: "commentDeleted", commentId: string, destroyed: boolean): void;
}>();

const props = withDefaults(
  defineProps<{
    commentList: Comment[];
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

/** 解析评论图片路径（后端以逗号分隔） */
function getCommentImages(imgPaths: string | null | undefined): string[]
{
  if (!imgPaths) return [];
  return imgPaths.split(",").filter(path => path.trim() !== "");
}

/** 0 未删 / 1 用户 / 2 发布者 / 3 管理员 */
function isSoftDeleted(deleted: number | null | undefined): boolean
{
  return deleted != null && deleted !== 0;
}

function getDeletedLabel(deleted: number | null | undefined): string
{
  switch (deleted)
  {
    case 1:
      return "用户已删除";
    case 2:
      return "发布者已删除";
    case 3:
      return "管理员已删除";
    default:
      return "已删除";
  }
}

/**
 * 删除按钮点击：弹窗二次确认后执行删除
 * 已逻辑删除（deleted=1/2/3）的评论会走彻底清除接口
 */
async function handleDeleteClick(row: Comment)
{
  const commentId = row.commentId;
  const destroyed = isSoftDeleted(row.deleted);
  const actionText = destroyed ? "彻底删除" : "删除";

  try
  {
    await ElMessageBox.confirm(
      `确定要${actionText}这条评论吗？`,
      `${actionText}确认`,
      {
        type: "warning",
        confirmButtonText: actionText,
        cancelButtonText: "取消",
      },
    );
  } catch
  {
    return;
  }

  const result = destroyed
    ? await CommentApi.destroyComment(commentId)
    : await CommentApi.deleteComment(commentId);

  if (result && result.code === 200)
  {
    message.success(destroyed ? "已彻底删除" : "删除成功");
    emit("commentDeleted", commentId, destroyed);
  }
}
</script>

<template>
  <div class="comment-table">
    <el-table v-loading="loading" :data="commentList || []" style="width: 100%" stripe border size="large"
      row-key="commentId" highlight-current-row>
      <el-table-column label="评论信息" align="left" min-width="520">
        <template #default="{ row }">
          <div class="comment-info-cell" :class="{ 'is-deleted': isSoftDeleted(row.deleted) }">
            <el-avatar class="avatar" :src="imgRequestUrl(row.avatar, true)" :size="48">
              <span class="avatar-fallback">{{ row.nickName?.charAt(0) ?? "?" }}</span>
            </el-avatar>

            <div class="comment-body">
              <div class="reply-info">
                <template v-if="row.replyNickName">
                  <span class="user-name">{{ row.nickName }}</span>
                  <span class="reply-text"> 回复了 </span>
                  <span class="user-name">{{ row.replyNickName }}</span>
                  <span class="reply-text"> 的评论</span>
                </template>
                <template v-else>
                  <span class="user-name">{{ row.nickName }}</span>
                  <span class="reply-text"> 发表了评论</span>
                </template>
                <span v-if="isSoftDeleted(row.deleted)" class="deleted-tag">【{{ getDeletedLabel(row.deleted) }}】</span>
              </div>

              <div class="comment-content">{{ row.content }}</div>

              <div v-if="getCommentImages(row.imgPaths).length > 0" class="images">
                <Cover v-for="imgPath in getCommentImages(row.imgPaths)" :key="imgPath" :src="imgRequestUrl(imgPath)"
                  :width="100" :preview="true" fit="scale-down" :auto-height="true" :thumbnail="true" />
              </div>

              <div class="bottom-row">
                <span class="post-time">{{ formatPostTime(row.postTime) }}</span>
                <div class="delete-btn" @click="handleDeleteClick(row)">
                  <span class="iconfont icon-delete"></span>
                  <span class="delete-text">{{ isSoftDeleted(row.deleted) ? "彻底删除" : "删除" }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="视频信息" align="center" width="200">
        <template #default="{ row }">
          <div class="video-info-cell">
            <el-image :src="imgRequestUrl(row.videoCover, true)" fit="cover" class="cover-img">
              <template #error>
                <div class="cover-placeholder">
                  <el-icon>
                    <PictureFilled />
                  </el-icon>
                </div>
              </template>
            </el-image>
            <span class="video-name" :title="row.videoName">{{ row.videoName }}</span>
          </div>
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
.comment-table {
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

.comment-info-cell {
  display: flex;
  column-gap: 12px;
  padding: 4px 12px;

  &.is-deleted {
    opacity: 0.72;
  }
}

.avatar {
  flex-shrink: 0;
}

.avatar-fallback {
  font-size: 16px;
}

.comment-body {
  display: flex;
  flex-direction: column;
  row-gap: 6px;
  flex: 1;
  min-width: 0;
}

.reply-info {
  font-size: 13px;
  color: $color-text-secondary;

  .user-name {
    color: $color-bilibili-blue;
    font-weight: 500;
  }

  .reply-text {
    color: $color-text-muted;
  }

  .deleted-tag {
    margin-left: 8px;
    padding: 1px 6px;
    border-radius: 10px;
    font-size: 12px;
    color: $color-warning-red;
    background-color: $color-warning-red-background;
  }
}

.comment-content {
  font-size: 14px;
  color: $color-text-primary;
  word-break: break-word;
  white-space: pre-wrap;
}

.images {
  display: flex;
  column-gap: 8px;
  flex-wrap: wrap;
}

.bottom-row {
  display: flex;
  align-items: center;
  column-gap: 12px;

  .post-time {
    font-size: 12px;
    color: $color-text-muted;
  }

  .delete-btn {
    display: flex;
    align-items: center;
    column-gap: 4px;
    position: relative;
    overflow: visible;
    border-radius: 20px;
    padding: 4px 8px;
    cursor: pointer;
    transition: all 0.25s ease;

    .icon-delete {
      font-size: 16px;
      color: $color-text-secondary;
    }

    .delete-text {
      display: inline-block;
      font-size: 13px;
      line-height: 13px;
      vertical-align: middle;
      max-width: 80px;
      overflow: hidden;
      white-space: nowrap;
      color: $color-text-secondary;
      transition: max-width 0.35s ease, margin-right 0.35s ease;
    }

    &:hover {
      background-color: rgba(255, 0, 0, 0.3);
    }
  }
}

.video-info-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  row-gap: 8px;
  padding: 0 8px;
}

.cover-img {
  width: 120px;
  height: 68px;
  border-radius: 6px;

  :deep(img) {
    object-fit: cover;
    border-radius: 6px;
  }
}

.cover-placeholder {
  width: 120px;
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $color-surface;
  border-radius: 6px;
  color: $color-text-muted;
  font-size: 24px;
}

.video-name {
  font-size: 13px;
  color: $color-text-primary;
  text-align: center;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
