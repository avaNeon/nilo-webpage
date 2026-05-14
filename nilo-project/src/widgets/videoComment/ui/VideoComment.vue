<script lang="ts" setup>
import { computed, ref } from 'vue';
import CommentThread from './CommentThread.vue';
import type { VideoComment } from '@/shared/model/VideoComment';
import CommentPostBar from '@/features/commentPostBar/ui/CommentPostBar.vue';

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
    { key: 1, label: '热度', value: 'popular' },
    { key: 2, label: '最早', value: 'earliest' },
    { key: 3, label: '最新', value: 'latest' }
])

const selectedSortType = ref('popular')
const addedCount = ref(0)
const commentNumberRef = computed(() =>
{
    return props.commentNumber + addedCount.value
})

</script>

<template>
    <div id="video-comment-section" class="comment-section">
        <div class="title">
            <span class="title-text">评论</span>
            <span class="comment-number">{{ commentNumberRef }}</span>
            <div class="sort-type">
                <el-select v-model="selectedSortType" :disabled="!available" placeholder="排序方式" style="width: 75px">
                    <el-option v-for="sortItem in sorttype" :key="sortItem.key" :label="sortItem.label"
                        :value="sortItem.value" @click="emit('loadBySortType', sortItem.value)">
                    </el-option>
                </el-select>
            </div>
        </div>
        <CommentPostBar parent-comment-id="0" :available="available" @comment-posted="(comment: VideoComment) =>
        {
            addedCount++
            videoComments.unshift(comment)
        }" />
        <CommentThread class="root-thread" v-if="available" v-for="(comment, index) in videoComments"
            :key="comment.commentId" :comment="comment" :depth="0" :is-last-child="index === videoComments.length - 1"
            @load-more="(id) => emit('loadMore', id)" @add-comment-count="addedCount++" />
        <div class="no-comment" v-else>
            <span class="description-text"> 视频发布者已关闭评论区 </span>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.comment-section {

    .title {
        display: flex;
        align-items: center;

        .title-text {
            font-size: 24px;
            font-weight: bold;
        }

        .comment-number {
            margin-left: 15px;
            margin-right: 30px;
            font-size: 20px;
        }
    }

    .no-comment {
        padding: 200px 0;
        border-top: 1px solid $color-neutral-2;
        border-bottom: 1px solid $color-neutral-2;
        text-align: center;

        .description-text {
            color: $color-text-secondary;
            font-size: 20px;
        }
    }
}
</style>

<style lang="scss">
.el-select__wrapper {
    border-radius: 15px;
    font-weight: bold;
    border: 1px solid $color-neutral-2;
    box-shadow: none !important;
}
</style>