<script lang="ts" setup>
import { computed, ref } from 'vue';
import CommentThread from './CommentThread.vue';
import type { VideoComment } from '@/shared/model/VideoComment';
import CommentPostBar from '@/pages/videoDetail/features/commentPostBar/ui/CommentPostBar.vue';
import { formatCount } from '@/shared/utils/NumberUtil';

const props = withDefaults(defineProps<{
    videoComments: VideoComment[],
    commentNumber?: number,
    available: boolean,
}>(), {
    commentNumber: 0
})

const emit = defineEmits<{
    (e: 'loadMore', commentId: string): void
    (e: 'loadBySortType', sortType: string): void
}>()

const sorttype = ref([
    { key: 1, label: '最热', value: 'popular' },
    { key: 3, label: '最新', value: 'latest' },
    { key: 2, label: '最早', value: 'earliest' }
])

const selectedSortType = ref('popular')
const addedCount = ref(0)
const commentNumberRef = computed(() =>
{
    return props.commentNumber + addedCount.value
})

function selectSortType(sortType: string)
{
    selectedSortType.value = sortType
    emit('loadBySortType', sortType)
}

</script>

<template>
    <section id="video-comment-section" class="video-comment-section">
        <div class="comment-header">
            <h2 class="comment-title">
                评论 <span class="comment-number">{{ formatCount(commentNumberRef) }}</span>
            </h2>
            <div class="sort-type" role="tablist" aria-label="评论排序">
                <button v-for="sortItem in sorttype" :key="sortItem.key" type="button" role="tab" class="sort-tab"
                    :class="{ active: selectedSortType === sortItem.value }"
                    :aria-selected="selectedSortType === sortItem.value" :disabled="!available"
                    @click="selectSortType(sortItem.value)">
                    {{ sortItem.label }}
                </button>
            </div>
        </div>
        <CommentPostBar parent-comment-id="0" :available="available" placeholder="友善发言，说说你的想法" @comment-posted="(comment: VideoComment) =>
        {
            addedCount++
            videoComments.unshift(comment)
        }" />
        <template v-if="available">
            <CommentThread class="root-thread" v-for="(comment, index) in videoComments" :key="comment.commentId"
                :comment="comment" :depth="0" :is-last-child="index === videoComments.length - 1"
                @load-more="(id) => emit('loadMore', id)" @add-comment-count="addedCount++" />
            <div v-if="videoComments.length === 0 && commentNumberRef === 0" class="comment-state">
                还没有评论，来说两句吧
            </div>
        </template>
        <div class="comment-state" v-else>
            视频发布者已关闭评论区
        </div>
    </section>
</template>

<style lang="scss" scoped>
.video-comment-section {
    display: flex;
    flex-direction: column;
    gap: 22px;
    color: $warm-ink;

    .comment-header {
        display: flex;
        align-items: baseline;
        gap: 20px;

        .comment-title {
            margin: 0;
            font-size: 20px;
            font-weight: 700;
            color: $warm-ink;

            .comment-number {
                font-size: 15px;
                font-weight: 500;
                color: $warm-ink-4;
            }
        }

        .sort-type {
            display: flex;
            align-items: baseline;
            gap: 20px;
        }

        .sort-tab {
            padding: 0;
            border: none;
            background: transparent;
            font: inherit;
            font-size: 13px;
            color: $warm-ink-4;
            cursor: pointer;
            transition: color 0.15s ease;

            &:hover:not(:disabled),
            &:focus-visible {
                color: $warm-ink;
                outline: none;
            }

            &.active {
                font-weight: 600;
                color: $warm-ink;
            }

            &:disabled {
                cursor: not-allowed;
                color: $warm-ink-5;
            }
        }
    }

    // 评论区关闭 / 暂无评论
    .comment-state {
        padding: 32px;
        border-radius: 16px;
        background: $warm-card;
        box-shadow: $warm-shadow-ring;
        font-size: 14px;
        color: $warm-ink-4;
        text-align: center;
    }
}
</style>
