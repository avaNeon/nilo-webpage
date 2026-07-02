<script lang="ts" setup>
import { computed } from "vue";
import { ElMessageBox } from "element-plus";
import type { UserInfo } from "@/pages/index/widgets/user/model/UserInfo";
import { UserApi } from "@/pages/index/widgets/user/api/UserApi";
import
{
  UserStatusEnum,
  getUserStatusClass,
  getUserStatusLabel,
} from "@/pages/index/widgets/user/model/enum/UserStatusEnum";
import { imgRequestUrl } from "@/shared/utils/ImgUtil";
import message from "@/shared/lib/message";
import dayjs from "dayjs";

const emit = defineEmits<{
  (e: "changePageNo", pageNo: number): void;
  (e: "changePageSize", pageSize: number): void;
  (e: "userStatusChanged", userId: string, status: number): void;
}>();

const props = withDefaults(
  defineProps<{
    userList: UserInfo[];
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

function formatDateTime(value: string | null | undefined): string
{
  if (!value) return "-";
  const date = dayjs(value);
  return date.isValid() ? date.format("YYYY-MM-DD HH:mm") : value;
}

/** 生日为空时显示占位符 */
function formatBirthday(value: string | null | undefined): string
{
  if (!value) return "-";
  return value;
}

/**
 * 根据当前状态返回切换操作的文本与状态
 * - 已禁用 → 解禁
 * - 正常   → 禁用
 */
function getToggleStatusAction(status: number)
{
  return status === UserStatusEnum.Disable
    ? { label: "解禁", nextStatus: UserStatusEnum.Enable }
    : { label: "禁用", nextStatus: UserStatusEnum.Disable };
}

/** 切换状态按钮：二次确认后调用接口 */
async function handleToggleStatusClick(row: UserInfo)
{
  const { label, nextStatus } = getToggleStatusAction(row.status);

  try
  {
    await ElMessageBox.confirm(
      `确定要${label}用户「${row.nickName || row.userId}」吗？`,
      `${label}确认`,
      {
        type: "warning",
        confirmButtonText: label,
        cancelButtonText: "取消",
      },
    );
  } catch
  {
    return;
  }

  const result = await UserApi.changeUserStatus(row.userId, nextStatus);
  if (result && result.code === 200)
  {
    message.success(`${label}成功`);
    emit("userStatusChanged", row.userId, nextStatus);
  }
}
</script>

<template>
  <div class="user-table">
    <div class="table-scroll-wrapper">
      <el-table
        v-loading="loading"
        :data="userList || []"
        stripe
        border
        size="large"
        row-key="userId"
        highlight-current-row
        class="user-data-table"
      >
        <!-- 头像 -->
        <el-table-column label="头像" width="100" align="center">
          <template #default="{ row }">
            <el-avatar :src="imgRequestUrl(row.avatar)" :size="48">
              <span class="avatar-fallback">{{ row.nickName?.charAt(0) ?? "?" }}</span>
            </el-avatar>
          </template>
        </el-table-column>

        <el-table-column label="用户ID" prop="userId" min-width="200" show-overflow-tooltip />

        <el-table-column label="昵称" prop="nickName" min-width="160" show-overflow-tooltip />

        <el-table-column label="邮箱" prop="email" min-width="220" show-overflow-tooltip />

        <!-- 注册时间 / 最后登录时间 -->
        <el-table-column label="注册/登录时间" min-width="260" align="center">
          <template #default="{ row }">
            <div class="time-cell">
              <div class="time-row">
                <span class="time-label">注册</span>
                <span class="time-value">{{ formatDateTime(row.registerTime) }}</span>
              </div>
              <div class="time-row">
                <span class="time-label">登录</span>
                <span class="time-value">{{ formatDateTime(row.lastLoginTime) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 硬币总数 / 当前硬币数 -->
        <el-table-column label="硬币" min-width="140" align="center">
          <template #default="{ row }">
            <div class="coin-cell">
              <div class="coin-row">
                <span class="coin-label">总量</span>
                <span class="coin-value">{{ row.totalCoin ?? "-" }}</span>
              </div>
              <div class="coin-row">
                <span class="coin-label">现有</span>
                <span class="coin-value">{{ row.currentCoin ?? "-" }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" min-width="110" align="center">
          <template #default="{ row }">
            <span :class="['status-tag', getUserStatusClass(row.status)]">
              {{ getUserStatusLabel(row.status) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="最后登录IP" prop="lastLoginIp" min-width="160" align="center" show-overflow-tooltip />

        <el-table-column label="生日" min-width="140" align="center">
          <template #default="{ row }">
            {{ formatBirthday(row.birthday) }}
          </template>
        </el-table-column>

        <el-table-column label="个人简介" prop="personalIntroduction" min-width="260" show-overflow-tooltip />

        <!-- 禁用 / 解禁，固定在最右侧 -->
        <el-table-column label="切换状态" width="110" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              :type="row.status === UserStatusEnum.Disable ? 'success' : 'danger'"
              size="small"
              link
              @click="handleToggleStatusClick(row)"
            >
              {{ getToggleStatusAction(row.status).label }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div v-if="showPagination" class="pagination-wrapper">
      <el-pagination
        background
        :total="localTotalCount"
        :page-sizes="[5, 10, 15, 20]"
        :page-size="localPageSize"
        :current-page="localCurrentPage"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handlePageSizeChange"
        @current-change="handlePageNoChange"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.user-table {
  .table-scroll-wrapper {
    overflow-x: auto;
  }

  .user-data-table {
    width: max-content;
    min-width: 100%;
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

      &:hover {
        background-color: #f8faff !important;
      }
    }

    .el-table__cell {
      padding: 12px 8px;
    }
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 16px 20px;
}

.avatar-fallback {
  font-size: 16px;
}

.time-cell,
.coin-cell {
  display: flex;
  flex-direction: column;
  row-gap: 4px;
  padding: 0 8px;
}

.time-row,
.coin-row {
  display: flex;
  align-items: center;
  column-gap: 8px;
  font-size: 12px;
}

.time-label,
.coin-label {
  flex-shrink: 0;
  width: 28px;
  color: $color-text-muted;
  text-align: right;
}

.time-value,
.coin-value {
  color: $color-text-primary;
  word-break: break-all;
}

.status-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  line-height: 20px;

  &.status-enabled {
    color: #00a870;
    background-color: rgba(0, 168, 112, 0.12);
  }

  &.status-disabled {
    color: $color-warning-red;
    background-color: $color-warning-red-background;
  }
}
</style>
