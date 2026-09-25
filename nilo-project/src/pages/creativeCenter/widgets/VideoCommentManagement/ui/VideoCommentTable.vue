<script lang="ts" setup>
import { reactive } from 'vue';
import type { CommentManagement } from '../model/CommentManagement';
import Cover from '@/shared/ui/Cover.vue';
import defaultAvatar from '@/assets/user.svg';
import { imgRequestUrl } from '@/shared/utils/ImgUtil';
import { formatPostTime } from '@/shared/utils/DateUtil';
import confirm from '@/shared/lib/confirm';

const props = defineProps<{
    commentList: CommentManagement[];
    /** 正在删除的评论 ID */
    deletingIds: ReadonlySet<string>;
}>();

const emit = defineEmits<{
    /** 确认删除后通知页面去删 */
    (e: 'delete', commentId: string): void;
}>();

/** 评论图片小图：132 × 88 */
const IMAGE_WIDTH = 132;
const IMAGE_SCALE = 88 / 132;

// 加载失败的图片：头像换成默认头像，视频封面显示灰色占位
const failedSrcs = reactive(new Set<string>());

function thumbSrc(path: string | null): string
{
    const src = imgRequestUrl(path, true);
    return src && !failedSrcs.has(src) ? src : '';
}

function markFailed(path: string | null)
{
    const src = imgRequestUrl(path, true);
    if (src) failedSrcs.add(src);
}

// 评论图片路径用逗号分隔，可能有多张
function imagesOf(row: CommentManagement): string[]
{
    if (!row.imgPaths) return [];
    return row.imgPaths.split(',').map(path => path.trim()).filter(path => path !== '');
}

function isDeleting(row: CommentManagement): boolean
{
    return row.commentId !== null && props.deletingIds.has(row.commentId);
}

function askDelete(row: CommentManagement)
{
    const commentId = row.commentId;
    if (!commentId) return;
    confirm({
        message: '确定要删除这条评论吗？',
        confirmText: '删除',
        confirmFun: () =>
        {
            emit('delete', commentId);
        },
    });
}
</script>

<template>
    <div class="comment-table">
        <div class="table-head" aria-hidden="true">
            <span>评论信息</span>
            <span>视频信息</span>
        </div>

        <ul class="comment-rows">
            <li v-for="(row, index) in commentList" :key="row.commentId ?? `row-${index}`" class="comment-row">
                <!-- 头像 -->
                <RouterLink class="avatar" :to="`/user/${row.userId}`" target="_blank" tabindex="-1"
                    aria-hidden="true">
                    <img :src="thumbSrc(row.avatar) || defaultAvatar" alt="" loading="lazy"
                        @error="markFailed(row.avatar)">
                </RouterLink>

                <!-- 评论主体 -->
                <div class="comment-body">
                    <p class="comment-meta">
                        <RouterLink class="user-link" :to="`/user/${row.userId}`" target="_blank">
                            {{ row.nickName ?? '未知用户' }}
                        </RouterLink>
                        <template v-if="row.replyNickName">
                            <span>回复了</span>
                            <RouterLink class="user-link" :to="`/user/${row.replyUserId}`" target="_blank">
                                {{ row.replyNickName }}
                            </RouterLink>
                            <span>的评论</span>
                        </template>
                        <span v-else>在你的视频下面评论</span>
                    </p>

                    <p class="comment-text">{{ row.content }}</p>

                    <div v-if="imagesOf(row).length > 0" class="comment-images">
                        <Cover v-for="(imgPath, imgIndex) in imagesOf(row)" :key="`${imgIndex}-${imgPath}`"
                            class="comment-image" :src="imgRequestUrl(imgPath)" :width="IMAGE_WIDTH"
                            :scale="IMAGE_SCALE" fit="cover" :border-radius="14" :preview="true" :thumbnail="true" />
                    </div>

                    <div class="comment-foot">
                        <span class="post-time">{{ formatPostTime(row.postTime) }}</span>
                        <button type="button" class="delete-button" :disabled="isDeleting(row)" @click="askDelete(row)">
                            删除
                        </button>
                    </div>
                </div>

                <!-- 视频信息：点击新标签页打开视频 -->
                <RouterLink v-if="row.videoId" class="video-info"
                    :to="{ name: 'video', params: { videoId: row.videoId } }" target="_blank">
                    <span class="video-thumb">
                        <img v-if="thumbSrc(row.videoCover)" :src="thumbSrc(row.videoCover)" alt="" loading="lazy"
                            @error="markFailed(row.videoCover)">
                    </span>
                    <span class="video-title" :title="row.videoName ?? undefined">{{ row.videoName ?? '未知视频' }}</span>
                </RouterLink>
                <div v-else class="video-info">
                    <span class="video-thumb"></span>
                    <span class="video-title">{{ row.videoName ?? '未知视频' }}</span>
                </div>
            </li>
        </ul>
    </div>
</template>

<style lang="scss" scoped>
@use '@/pages/creativeCenter/shared/styles/cc' as *;

.table-head {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 200px;
    gap: 16px;
    padding: 4px 4px 12px;
    font-size: 12px;
    font-weight: 600;
    color: $warm-ink-4;
}

.comment-rows {
    margin: 0;
    padding: 0;
    list-style: none;
}

.comment-row {
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr) 200px;
    gap: 16px;
    align-items: start;
    padding: 18px 4px;
    border-top: 1px solid $cc-line;
}

.avatar {
    display: block;
    width: 44px;
    height: 44px;
    overflow: hidden;
    border-radius: 50%;
    background: $warm-sunken;

    img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
}

.comment-body {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
}

.comment-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin: 0;
    font-size: 13px;
    color: $warm-ink-4;
}

.user-link {
    font-weight: 700;
    color: $warm-accent;

    &:hover {
        text-decoration: underline;
    }

    &:focus-visible {
        outline: 2px solid $warm-accent;
        outline-offset: 2px;
    }
}

.comment-text {
    margin: 0;
    font-size: 15px;
    line-height: 1.6;
    color: $warm-ink;
    white-space: pre-wrap;
    word-break: break-word;
    text-wrap: pretty;
}

.comment-images {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .comment-image {
        background: $warm-sunken;
    }
}

.comment-foot {
    display: flex;
    align-items: center;
    gap: 14px;
}

.post-time {
    @include mono(12px);
    color: $warm-ink-4;
}

.delete-button {
    @include danger-pill(28px);
    padding: 0 12px;

    &:disabled {
        opacity: 0.6;
    }
}

.video-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;

    &:focus-visible {
        outline: 2px solid $warm-accent;
        outline-offset: 3px;
        border-radius: 12px;
    }
}

a.video-info:hover .video-title {
    color: $warm-accent;
}

.video-thumb {
    display: block;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border-radius: 12px;
    background: linear-gradient(160deg, oklch(0.93 0.008 265), oklch(0.83 0.014 265));

    img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
}

.video-title {
    display: -webkit-box;
    overflow: hidden;
    font-size: 12px;
    line-height: 1.5;
    color: $warm-ink-2;
    word-break: break-word;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    transition: color 0.2s;
}
</style>
