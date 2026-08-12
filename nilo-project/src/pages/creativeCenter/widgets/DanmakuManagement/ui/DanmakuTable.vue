<script lang="ts" setup>
import { computed, watch, nextTick, ref } from "vue";
import type { DanmakuManagement } from "../model/DanmakuManagement";
import { useRouter } from "vue-router";
import confirm from "@/shared/lib/confirm";
import { formatPostTime } from "@/shared/utils/DateUtil";

const emit = defineEmits<{
  (e: "changePageNo", pageNo: number): void;
  (e: "changePageSize", pageSize: number): void;
  (e: "danmakuDeleted", danmakuId: string): void;
}>();

const props = withDefaults(
  defineProps<{
    danmakuList: DanmakuManagement[];
    totalCount: number;
    showPagination?: boolean;
    currentPage: number;
    pageSize: number;
  }>(),
  {
    showPagination: true,
  },
);

const router = useRouter();

// these for avoiding pagination view exception
const localTotalCount = computed(() => Number(props.totalCount ?? 0));
const localCurrentPage = computed(() => Math.max(1, Number(props.currentPage ?? 1)));
const localPageSize = computed(() => Math.max(1, Number(props.pageSize ?? 10)));

// 回到页面最顶端
const scrollToAnchor = () =>
{
  window.scrollTo(0, 0);
};

// 切换每页大小
const handlePageSizeChange = (size: number) =>
{
  emit("changePageSize", size);
  scrollToAnchor();
};

// 切换页码
const handlePageNoChange = (newPageNo: number) =>
{
  emit("changePageNo", newPageNo);
  scrollToAnchor();
};

// ----- 毫秒转可读时间 -----
function formatDisplayMoment(ms: number | null): string
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

// ----- 位置描述 -----
function formatPosition(pos: number | null): string
{
  if (pos === null || pos === undefined) return "-";
  switch (pos)
  {
    case 0: return "滚动";
    case 1: return "顶部";
    case 2: return "底部";
    default: return String(pos);
  }
}

// ----- 视频信息文本 -----
function getVideoInfoText(row: DanmakuManagement): string
{
  const name = row.videoName ?? "未知视频";
  const idx = row.fileIndex != null ? `P${row.fileIndex}` : "";
  return idx ? `${name} - ${idx}` : name;
}

// ----- 点击跳转视频详情 -----
function goToVideo(row: DanmakuManagement)
{
  if (row.videoId)
  {
    const routeData = router.resolve({
      name: "video",
      params: {
        videoId: row.videoId,
        index: row.fileIndex != null ? String(row.fileIndex) : undefined,
      },
    });
    window.open(routeData.href, "_blank");
  }
}

// ----- 删除按钮 -----
function handleDeleteClick(row: DanmakuManagement)
{
  const danmakuId = row.danmakuId!;
  confirm({
    message: "确定要删除该弹幕吗？",
    confirmText: "删除",
    confirmFun: () =>
    {
      emit("danmakuDeleted", danmakuId);
    },
  });
}

// ----- 颜色圆点：直接用 TS 操作 DOM 设置颜色（后端返回的 color 已带 # 前缀） -----
const tableRef = ref<InstanceType<typeof import('element-plus').ElTable> | null>(null);

watch(
  () => props.danmakuList,
  () => {
    nextTick(() => {
      const el = tableRef.value?.$el as HTMLElement | undefined;
      if (!el) return;
      const dots = el.querySelectorAll<HTMLElement>(".color-dot");
      dots.forEach((dot, i) => {
        const item = props.danmakuList[i];
        dot.style.backgroundColor = item?.color || "#fff";
      });
    });
  },
  { deep: true, immediate: true },
);
</script>

<template>
  <div class="content">
    <el-table ref="tableRef" :data="danmakuList || []" stripe border highlight-current-row>
      <!-- 发送者 -->
      <el-table-column label="发送者" align="center" width="120">
        <template #default="{ row }">
          <router-link class="user-link" :to="`/user/${row.userId}`" target="_blank">
            {{ row.nickName }}
          </router-link>
        </template>
      </el-table-column>

      <!-- 展示信息 -->
      <el-table-column label="展示信息" align="center" width="150">
        <template #default="{ row }">
          <div class="display-info-cell">
            <span class="display-moment">{{ formatDisplayMoment(row.displayMoment) }}</span>
            <span class="display-position">{{ formatPosition(row.position) }}</span>
            <span class="display-color">
              <span class="color-dot"></span>
              {{ row.color ?? '-' }}
            </span>
          </div>
        </template>
      </el-table-column>

      <!-- 弹幕内容 -->
      <el-table-column label="弹幕内容" align="left" width="800">
        <template #default="{ row }">
          <span class="danmaku-content">{{ row.content }}</span>
        </template>
      </el-table-column>

      <!-- 视频信息 -->
      <el-table-column label="视频信息" align="center" width="180">
        <template #default="{ row }">
          <span class="video-link" @click="goToVideo(row)">
            {{ getVideoInfoText(row) }}
          </span>
        </template>
      </el-table-column>

      <!-- 发送时间 -->
      <el-table-column label="发送时间" align="center" width="160">
        <template #default="{ row }">
          <span class="post-time">{{ formatPostTime(row.postTime) }}</span>
        </template>
      </el-table-column>

      <!-- 操作 -->
      <el-table-column label="操作" align="center" width="100">
        <template #default="{ row }">
          <span class="delete-btn" @click="handleDeleteClick(row)">删除</span>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination" v-if="showPagination">
      <el-pagination v-if="showPagination && totalCount" background :total="localTotalCount" :page-sizes="[3, 5, 7, 10]"
        :page-size="localPageSize" :current-page="localCurrentPage" layout="total, sizes, prev, pager, next, jumper"
        @size-change="handlePageSizeChange" @current-change="handlePageNoChange"></el-pagination>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.content {
  display: block;
  width: fit-content;
  margin: 0 auto;
}

.pagination {
  padding-top: 10px 0;

  margin: 20px;
}

.el-table__body tr.current-row>td.el-table__cell {
  background-color: #e6f0f9;
}

.el-table__body tr:hover>td.el-table__cell {
  background-color: #e6f0f9 !important;
}

// ----- 发送者 -----
.user-link {
  color: $color-bilibili-blue;
  text-decoration: none;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
}

// ----- 展示信息 -----
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

// ----- 弹幕内容 -----
.danmaku-content {
  font-size: 14px;
  color: $color-text-primary;
  word-break: break-word;
  white-space: pre-wrap;
}

// ----- 视频信息 -----
.video-link {
  color: $color-bilibili-blue;
  cursor: pointer;
  text-decoration: none;
  font-size: 13px;

  &:hover {
    text-decoration: underline;
  }
}

// ----- 发送时间 -----
.post-time {
  font-size: 13px;
  color: $color-text-secondary;
}

// ----- 删除按钮 -----
.delete-btn {
  color: $color-bilibili-blue;
  cursor: pointer;
  font-size: 13px;

  &:hover {
    text-decoration: underline;
  }
}
</style>
