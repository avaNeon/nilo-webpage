<script lang="ts" setup>
import { ref, onBeforeUnmount, computed } from "vue";
import type { CommentManagement } from "../model/CommentManagement";
import Avatar from "@/entities/avatar/ui/Avatar.vue";
import Cover from "@/shared/ui/Cover.vue";
import { imgRequestUrl } from "@/shared/utils/ImgUtil";
import { CommentApi } from "@/shared/api/CommentApi";
import message from "@/shared/lib/message";
import dayjs, { type Dayjs } from "dayjs";
import { useRouter } from "vue-router";

const emit = defineEmits<{
    (e: "changePageNo", pageNo: number): void;
    (e: "changePageSize", pageSize: number): void;
    (e: "commentDeleted", commentId: string): void;
}>();

const props = withDefaults(
    defineProps<{
        commentList: CommentManagement[];
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

const COMMENT_IMG_WIDTH = 100;

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

// ----- 发布时间格式化 -----
function formatPostTime(postTime: string | null): string
{
    if (!postTime) return "";
    const now: Dayjs = dayjs();
    const postDate = dayjs(postTime);
    const diffMin = now.diff(postDate, "minute");
    if (diffMin < 1) return "刚刚";
    return postDate.format("YYYY-MM-DD HH:mm");
}

// ----- 删除按钮确认流程（与评论组件一致） -----
const confirmingMap = ref<Record<string, boolean>>({});
const cooldownMap = ref<Record<string, boolean>>({});
const borderProgressMap = ref<Record<string, number>>({});
const animFrameMap: Record<string, number | null> = {};

function deleteButtonText(commentId: string): string
{
    return confirmingMap.value[commentId] ? "确认删除" : "删除";
}

function isConfirming(commentId: string): boolean
{
    return !!confirmingMap.value[commentId];
}

function isCooldownActive(commentId: string): boolean
{
    return !!cooldownMap.value[commentId];
}

function getBorderProgress(commentId: string): number
{
    return borderProgressMap.value[commentId] ?? 0;
}

function startBorderAnimation(commentId: string)
{
    borderProgressMap.value[commentId] = 0;
    const startTime = performance.now();
    const duration = 3000;

    function animate(now: number)
    {
        const elapsed = now - startTime;
        borderProgressMap.value[commentId] = Math.min(elapsed / duration, 1);
        if ((borderProgressMap.value[commentId] ?? 0) < 1)
        {
            animFrameMap[commentId] = requestAnimationFrame(animate);
        }
    }

    animFrameMap[commentId] = requestAnimationFrame(animate);
}

async function handleDeleteClick(row: CommentManagement)
{
    const commentId = row.commentId!;
    if (cooldownMap.value[commentId]) return;

    if (!confirmingMap.value[commentId])
    {
        // 第一次点击：进入确认模式 + 3s 冷却
        confirmingMap.value[commentId] = true;
        cooldownMap.value[commentId] = true;
        startBorderAnimation(commentId);
        setTimeout(() =>
        {
            cooldownMap.value[commentId] = false;
        }, 3000);
        return;
    }

    // 第二次点击：执行实际删除
    const result = await CommentApi.deleteComment(commentId);
    if (result && result.code === 200)
    {
        message.success("删除成功");
        emit("commentDeleted", commentId);
    }
}

// ----- 点击跳转视频详情 -----
function goToVideo(videoId: string)
{
    if (videoId)
    {
        const routeData = router.resolve({
            name: "video",
            params: {
                videoId: videoId,
            },
        });
        window.open(routeData.href, "_blank");
    }
}

onBeforeUnmount(() =>
{
    for (const key of Object.keys(animFrameMap))
    {
        if (animFrameMap[key] !== null)
        {
            cancelAnimationFrame(animFrameMap[key]!);
        }
    }
});
</script>

<template>
    <div class="content">
        <el-table ref="dataTable" :data="commentList || []" stripe border highlight-current-row>
            <!-- 评论信息列 -->
            <el-table-column label="评论信息" align="left" width="1200">
                <template #default="{ row }">
                    <div class="comment-info-cell">
                        <!-- 头像 -->
                        <Avatar class="avatar" :user-id="row.userId" :src="imgRequestUrl(row.avatar)" :width="48"
                            :lazy="true" :user-panel="false" :mobile="false" />
                        <!-- 评论主体 -->
                        <div class="comment-body">
                            <!-- 回复人信息 -->
                            <div class="reply-info">
                                <template v-if="row.replyNickName">
                                    <router-link class="user-link" :to="`/user/${row.userId}`" target="_blank">
                                        {{ row.nickName }}
                                    </router-link>
                                    <span class="reply-text"> 回复了 </span>
                                    <router-link class="user-link" :to="`/user/${row.replyUserId}`" target="_blank">
                                        {{ row.replyNickName }}
                                    </router-link>
                                    <span class="reply-text"> 的评论</span>
                                </template>
                                <template v-else>
                                    <router-link class="user-link" :to="`/user/${row.userId}`" target="_blank">
                                        {{ row.nickName }}
                                    </router-link>
                                    <span class="reply-text"> 在你的视频下面评论</span>
                                </template>
                            </div>
                            <!-- 评论内容 -->
                            <div class="comment-content">{{ row.content }}</div>
                            <!-- 评论图片 -->
                            <div class="images" v-if="row.imgPaths != null && row.imgPaths.length > 0">
                                <div class="image" v-for="imgPath in row.imgPaths.split(',')" :key="imgPath">
                                    <Cover v-if="imgPath != null && imgPath != ''" :src="imgRequestUrl(imgPath)"
                                        :width="COMMENT_IMG_WIDTH" :preview="true" fit="scale-down" :auto-height="true"
                                        :thumbnail="true" />
                                </div>
                            </div>
                            <!-- 底部信息行：发布时间 + 删除 -->
                            <div class="bottom-row">
                                <span class="post-time">{{ formatPostTime(row.postTime) }}</span>
                                <div :class="{
                                    'delete-btn': true,
                                    confirming: isConfirming(row.commentId!),
                                    cooldown: isCooldownActive(row.commentId!),
                                }" @click="handleDeleteClick(row)">
                                    <span class="iconfont icon-delete"></span>
                                    <span class="delete-text">{{ deleteButtonText(row.commentId!) }}</span>
                                    <div v-if="isCooldownActive(row.commentId!)" class="delete-border-overlay" :style="{
                                        background: `conic-gradient(from -90deg, rgba(255, 68, 68, 0.6) ${getBorderProgress(row.commentId!) * 360
                                            }deg, transparent 0deg)`,
                                    }"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </el-table-column>

            <!-- 视频信息列 -->
            <el-table-column label="视频信息" align="left" width="200">
                <template #default="{ row }">
                    <div class="video-info-cell">
                        <Cover :src="imgRequestUrl(row.videoCover)" :width="120" :scale="0.5625" fit="cover"
                            :border-radius="4" @click="goToVideo(row.videoId)" />
                        <span class="video-name">{{ row.videoName }}</span>
                    </div>
                </template>
            </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination" v-if="props.showPagination">
            <el-pagination background :total="localTotalCount" :page-sizes="[3, 5, 7, 10]" :page-size="localPageSize"
                :current-page="localCurrentPage" layout="total, sizes, prev, pager, next, jumper"
                @size-change="handlePageSizeChange" @current-change="handlePageNoChange" />
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
    padding-top: 10px;

    margin: 20px 0;
}

.el-table__body tr.current-row>td.el-table__cell {
    background-color: #e6f0f9;
}

.el-table__body tr:hover>td.el-table__cell {
    background-color: #e6f0f9 !important;
}

// ----- 评论信息单元格 -----
.comment-info-cell {
    display: flex;
    column-gap: 10px;
    padding: 5px 0;
}

.avatar {
    flex-shrink: 0;
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

    .user-link {
        color: $color-bilibili-blue;
        text-decoration: none;
        font-weight: 500;

        &:hover {
            text-decoration: underline;
        }
    }

    .reply-text {
        color: $color-text-muted;
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

// ----- 底部行 -----
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
            max-width: 0;
            overflow: hidden;
            white-space: nowrap;
            color: $color-text-secondary;
            transition: max-width 0.35s ease, margin-right 0.35s ease;
        }

        // 确认状态：文字常驻展开
        &.confirming {
            .delete-text {
                max-width: 80px;
            }
        }

        // 冷却/禁用状态
        &.cooldown {
            pointer-events: none;
            cursor: not-allowed;

            .icon-delete,
            .delete-text {
                color: rgba(255, 0, 0, 0.35);
            }
        }

        &:hover:not(.cooldown):not(.confirming) {
            background-color: rgba(255, 0, 0, 0.3);

            .delete-text {
                max-width: 50px;
                margin-right: 4px;
            }
        }

        &.confirming:hover {
            background-color: rgba(255, 0, 0, 0.3);
        }

        .delete-border-overlay {
            position: absolute;
            inset: -2px;
            border-radius: 22px;
            padding: 2px;
            pointer-events: none;
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
        }
    }
}

// ----- 视频信息单元格 -----
.video-info-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    row-gap: 8px;
}

.video-name {
    font-size: 13px;
    color: $color-text-primary;
    text-align: center;
    word-break: break-word;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
