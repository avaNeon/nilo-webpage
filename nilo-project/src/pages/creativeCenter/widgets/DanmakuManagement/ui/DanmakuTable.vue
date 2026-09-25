<script lang="ts" setup>
import type { DanmakuManagement } from '../model/DanmakuManagement';
import defaultAvatar from '@/assets/user.svg';
import confirm from '@/shared/lib/confirm';
import { formatPostTime } from '@/shared/utils/DateUtil';

const props = defineProps<{
    danmakuList: DanmakuManagement[];
    /** 正在删除的弹幕 ID */
    deletingIds: ReadonlySet<string>;
}>();

const emit = defineEmits<{
    /** 确认删除后通知页面去删 */
    (e: 'delete', danmakuId: string): void;
}>();

// ----- 毫秒转可读时间 -----
function formatDisplayMoment(ms: number | null): string
{
    if (ms === null || ms === undefined) return '-';
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
    if (pos === null || pos === undefined) return '-';
    switch (pos)
    {
        case 0: return '滚动';
        case 1: return '顶部';
        case 2: return '底部';
        default: return String(pos);
    }
}

// ----- 视频信息文本 -----
function getVideoInfoText(row: DanmakuManagement): string
{
    const name = row.videoName ?? '未知视频';
    const idx = row.fileIndex != null ? `P${row.fileIndex}` : '';
    return idx ? `${name} - ${idx}` : name;
}

// ----- 视频详情路由（带分P） -----
function videoRoute(videoId: string, row: DanmakuManagement)
{
    return {
        name: 'video',
        params: {
            videoId,
            index: row.fileIndex != null ? String(row.fileIndex) : undefined,
        },
    };
}

function isDeleting(row: DanmakuManagement): boolean
{
    return row.danmakuId !== null && props.deletingIds.has(row.danmakuId);
}

// ----- 删除按钮 -----
function askDelete(row: DanmakuManagement)
{
    const danmakuId = row.danmakuId;
    if (!danmakuId) return;
    confirm({
        message: '确定要删除该弹幕吗？',
        confirmText: '删除',
        confirmFun: () =>
        {
            emit('delete', danmakuId);
        },
    });
}
</script>

<template>
    <div class="danmaku-table" role="table" aria-label="弹幕列表">
        <div class="table-row table-head" role="row">
            <span role="columnheader">发送者</span>
            <span role="columnheader">展示信息</span>
            <span role="columnheader">弹幕内容</span>
            <span role="columnheader">视频信息</span>
            <span role="columnheader">发送时间</span>
            <span class="action-head" role="columnheader">操作</span>
        </div>

        <div v-for="(row, index) in danmakuList" :key="row.danmakuId ?? `row-${index}`" class="table-row danmaku-row"
            role="row">
            <!-- 发送者：弹幕数据里没有头像，统一用默认头像 -->
            <div class="sender-cell" role="cell">
                <RouterLink class="sender" :to="`/user/${row.userId}`" target="_blank" :title="row.nickName ?? undefined">
                    <img class="sender-avatar" :src="defaultAvatar" alt="">
                    <span class="sender-name">{{ row.nickName ?? '未知用户' }}</span>
                </RouterLink>
            </div>

            <!-- 展示信息：视频内时刻 + 位置 + 颜色 -->
            <div class="display-cell" role="cell">
                <span class="display-moment">{{ formatDisplayMoment(row.displayMoment) }}</span>
                <span class="display-style">
                    <span>{{ formatPosition(row.position) }}</span>
                    <span class="color-swatch" :style="{ backgroundColor: row.color || '#FFFFFF' }"
                        aria-hidden="true"></span>
                    <span class="color-text">{{ row.color ?? '-' }}</span>
                </span>
            </div>

            <div class="content-cell" role="cell">{{ row.content }}</div>

            <!-- 视频信息：点击新标签页打开对应分P -->
            <div role="cell">
                <RouterLink v-if="row.videoId" class="video-text video-link" :to="videoRoute(row.videoId, row)"
                    target="_blank" :title="getVideoInfoText(row)">
                    {{ getVideoInfoText(row) }}
                </RouterLink>
                <span v-else class="video-text">{{ getVideoInfoText(row) }}</span>
            </div>

            <div class="time-cell" role="cell">{{ formatPostTime(row.postTime) }}</div>

            <div class="action-cell" role="cell">
                <button type="button" class="delete-button" :disabled="isDeleting(row)" @click="askDelete(row)">
                    删除
                </button>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@use '@/pages/creativeCenter/shared/styles/cc' as *;

.table-row {
    display: grid;
    grid-template-columns: 110px 150px minmax(0, 1fr) 220px 140px 64px;
    gap: 16px;
}

.table-head {
    padding: 4px 4px 12px;
    font-size: 12px;
    font-weight: 600;
    color: $warm-ink-4;

    .action-head {
        text-align: right;
    }
}

.danmaku-row {
    align-items: center;
    padding: 14px 4px;
    border-top: 1px solid $cc-line;
    font-size: 13px;
    color: $warm-ink;
}

// ----- 发送者 -----
.sender-cell {
    min-width: 0;
}

.sender {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;

    &:hover .sender-name {
        text-decoration: underline;
    }

    &:focus-visible {
        outline: 2px solid $warm-accent;
        outline-offset: 2px;
        border-radius: 999px;
    }
}

.sender-avatar {
    flex-shrink: 0;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: $warm-sunken;
    object-fit: cover;
}

.sender-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 700;
    color: $warm-accent;
}

// ----- 展示信息 -----
.display-cell {
    display: flex;
    flex-direction: column;
    gap: 5px;
    min-width: 0;
}

.display-moment {
    @include mono(13px);
    font-weight: 500;
}

.display-style {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: $warm-ink-3;
}

.color-swatch {
    flex-shrink: 0;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    box-shadow: inset 0 0 0 1px rgba(11, 12, 18, 0.18);
}

.color-text {
    @include mono(11px);
}

// ----- 弹幕内容 -----
.content-cell {
    min-width: 0;
    font-size: 15px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-all;
}

// ----- 视频信息 -----
.video-text {
    display: -webkit-box;
    overflow: hidden;
    font-size: 13px;
    line-height: 1.5;
    color: $warm-ink-2;
    word-break: break-word;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.video-link {
    transition: color 0.2s;

    &:hover {
        color: $warm-accent;
    }

    &:focus-visible {
        outline: 2px solid $warm-accent;
        outline-offset: 2px;
    }
}

// ----- 发送时间 -----
.time-cell {
    @include mono(12px);
    color: $warm-ink-3;
}

// ----- 删除 -----
.action-cell {
    display: flex;
    justify-content: flex-end;
}

.delete-button {
    @include danger-pill(28px);
    padding: 0 12px;

    &:disabled {
        opacity: 0.6;
    }
}
</style>
