<script lang="ts" setup>
import { Search } from '@element-plus/icons-vue';
import { useVideoManagement } from '../model/useVideoManagement';
import VideoItem from '@/shared/entities/videoItem/ui/VideoItem.vue';
import { useRouter } from 'vue-router';
import type { VideoInfo } from '@/shared/model/VideoInfo';
import useVideoUploadEditStore from '@/shared/store/VideoUploadEditStore';
import { VideoManagementApi } from '../api/VideoManagementApi';
import message from '@/shared/lib/message';
import confirm from '@/shared/lib/confirm';

const {
    CategoryEnum,
    selectedCategory,
    videoCounts,
    videoInfoList,
    currentPage,
    pageSize,
    totalCount,
    searchKeyword,
    changeCategory,
    handleSizeChange,
    handlePageChange,
    removeVideo,
    loadVideoCounts,
} = useVideoManagement();

const router = useRouter()
const videoUploadEditStore = useVideoUploadEditStore()

function handleEdit(videoInfo: VideoInfo)
{
    if (!videoInfo.videoId) return
    videoUploadEditStore.setEditVideoInfo(videoInfo)
    router.push({
        name: 'videoUpload',
        query: {
            mode: 'edit',
            videoId: videoInfo.videoId,
        },
    })
}

async function handleToggleDanmaku(videoInfo: VideoInfo)
{
    if (!videoInfo.videoId) return
    const interactionSet = new Set(
        (videoInfo.interaction ?? '').split(',').map(v => v.trim()).filter(Boolean),
    )
    const currentlyClosed = interactionSet.has('0')
    // toggle: if currently closed → remove "0"; if open → add "0"
    if (currentlyClosed)
    {
        interactionSet.delete('0')
    } else
    {
        interactionSet.add('0')
    }
    const newInteraction = [...interactionSet].join(',')
    const result = await VideoManagementApi.setInteraction(videoInfo.videoId, newInteraction)
    if (result !== null)
    {
        videoInfo.interaction = newInteraction
        message.success(currentlyClosed ? '已开启弹幕' : '已关闭弹幕')
    }
}

async function handleToggleComment(videoInfo: VideoInfo)
{
    if (!videoInfo.videoId) return
    const interactionSet = new Set(
        (videoInfo.interaction ?? '').split(',').map(v => v.trim()).filter(Boolean),
    )
    const currentlyClosed = interactionSet.has('1')
    if (currentlyClosed)
    {
        interactionSet.delete('1')
    } else
    {
        interactionSet.add('1')
    }
    const newInteraction = [...interactionSet].join(',')
    const result = await VideoManagementApi.setInteraction(videoInfo.videoId, newInteraction)
    if (result !== null)
    {
        videoInfo.interaction = newInteraction
        message.success(currentlyClosed ? '已开启评论' : '已关闭评论')
    }
}

async function handleDeleteVideo(videoInfo: VideoInfo)
{
    if (!videoInfo.videoId) return
    const videoName = videoInfo.videoName || '该视频'
    confirm({
        message: `确定要删除「${videoName}」吗？删除后可能会无法恢复。`,
        confirmFun: async () =>
        {
            const result = await VideoManagementApi.deleteVideo(videoInfo.videoId!, '用户主动删除')
            if (result !== null && result.code === 200)
            {
                message.success('视频已删除')
                if (videoInfo.videoId)
                {
                    removeVideo(videoInfo.videoId)
                }
                loadVideoCounts()
            }
        },
    })
}
</script>

<template>
    <div class="content">
        <div class="header">
            <div class="title">视频管理</div>
            <div class="search">
                <el-input :suffix-icon="Search" placeholder="搜索" v-model="searchKeyword"></el-input>
            </div>
        </div>
        <div class="category">
            <div class="all">
                <span :class="{ selected: selectedCategory === CategoryEnum.ALL }" @click="changeCategory(0)">全部稿件 {{
                    videoCounts.pendingCount + videoCounts.completedCount + videoCounts.failedCount }}</span>
            </div>
            <div class="sub-category">
                <span :class="{ selected: selectedCategory === CategoryEnum.IN_PROGRESS }"
                    @click="changeCategory(1)">进行中 {{ videoCounts.pendingCount }}</span>
                <span :class="{ selected: selectedCategory === CategoryEnum.PASSED }" @click="changeCategory(2)">已通过 {{
                    videoCounts.completedCount }}</span>
                <span :class="{ selected: selectedCategory === CategoryEnum.FAILED }" @click="changeCategory(3)">未通过 {{
                    videoCounts.failedCount }}</span>
            </div>
        </div>
        <div class="video-list">
            <div class="video-item" v-for="(video, index) in videoInfoList">
                <VideoItem :key="video.videoId ?? index" :video-info="video" type="vertical" :author-mode="true"
                    :review-state="video.status" @edit="handleEdit" @toggle-danmaku="handleToggleDanmaku"
                    @toggle-comment="handleToggleComment" @delete-video="handleDeleteVideo" />
            </div>
        </div>
        <div class="pagination-wrapper">
            <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="totalCount"
                :page-sizes="[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]" layout="total, sizes, prev, pager, next, jumper"
                background @size-change="handleSizeChange" @current-change="handlePageChange" />
        </div>
    </div>
</template>

<style lang="scss" scoped>
.content {
    margin: 25px 200px;

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        border-bottom: 1px solid $color-border;

        .title {
            font-size: 16px;
            color: $color-bilibili-blue;
            font-weight: 500;

            padding-bottom: 10px;
            border-bottom: 2px solid $color-bilibili-blue;

            cursor: pointer;
        }

        .search {
            width: 300px;
            padding-bottom: 5px;
        }
    }

    .category {
        padding: 5px 0;

        .all {
            padding: 10px 0;
            font-size: 14px;

            border-bottom: 1px solid $color-border;

            cursor: pointer;

            span {
                &.selected {
                    color: $color-bilibili-blue;
                    font-weight: 500;
                }
            }
        }

        .sub-category {
            padding: 10px 0;
            font-size: 14px;

            display: flex;

            cursor: pointer;

            span {
                display: flex;
                align-items: center;

                &.selected {
                    color: $color-bilibili-blue;
                    font-weight: 500;
                }

                &+span::before {
                    content: '|';
                    color: $color-border;
                    margin: 0 10px;
                }
            }
        }
    }

    .video-list {
        display: flex;
        flex-direction: column;
        row-gap: 10px;
        padding: 10px 0;

        .video-item {
            height: 140px;
        }
    }

    .pagination-wrapper {
        display: flex;
        justify-content: center;
        padding: 20px 0;
    }
}
</style>
