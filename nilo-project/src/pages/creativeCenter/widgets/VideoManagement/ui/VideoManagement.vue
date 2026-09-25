<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import CcPageHeader from '@/pages/creativeCenter/shared/ui/CcPageHeader.vue';
import CcSearchPill from '@/pages/creativeCenter/shared/ui/CcSearchPill.vue';
import CcSegmented from '@/pages/creativeCenter/shared/ui/CcSegmented.vue';
import CcEmpty from '@/pages/creativeCenter/shared/ui/CcEmpty.vue';
import CcPager from '@/pages/creativeCenter/shared/ui/CcPager.vue';
import VideoPlayerDialog from '@/pages/creativeCenter/entities/videoPlayerDialog/ui/VideoPlayerDialog.vue';
import VideoWorkRow from './VideoWorkRow.vue';
import { PAGE_SIZE, useVideoManagement } from '../model/useVideoManagement';
import { canEditVideo, toVideoInfo } from '../model/videoWork';
import type { VideoUploadInfo } from '../model/VideoUploadInfo';
import type { VideoInfoFileUpload } from '@/shared/model/VideoInfoFileUpload';
import useVideoUploadEditStore from '@/shared/store/VideoUploadEditStore';
import { videoFileApi } from '@/shared/api/VideoFileApi';

const {
    activeTab,
    tabOptions,
    allCount,
    totalCount,
    searchKeyword,
    appliedKeyword,
    videoList,
    listLoaded,
    listLoading,
    currentPage,
    search,
    changePage,
    toggleInteraction,
    deleteVideo,
} = useVideoManagement()

const router = useRouter()
const videoUploadEditStore = useVideoUploadEditStore()

/*——————预览弹窗：未通过审核的稿件点封面 / 标题打开—————— */

const previewVisible = ref(false)
const previewVideoInfo = ref<VideoUploadInfo | null>(null)
const previewFileList = ref<VideoInfoFileUpload[]>([])
let previewRequestId = 0

async function handlePreview(video: VideoUploadInfo)
{
    if (!video.videoId) return
    const requestId = ++previewRequestId
    const files = await videoFileApi.loadVideoFileUpload(video.videoId)
    if (requestId !== previewRequestId) return
    previewVideoInfo.value = { ...video }
    previewFileList.value = files ?? []
    previewVisible.value = true
}

/*——————编辑：先把稿件信息放进 store，投稿页从 store 里读—————— */

function handleEdit(video: VideoUploadInfo)
{
    if (!video.videoId || !canEditVideo(video)) return
    videoUploadEditStore.setEditVideoInfo(toVideoInfo(video))
    router.push({
        name: 'videoUpload',
        query: {
            mode: 'edit',
            videoId: video.videoId,
        },
    })
}
</script>

<template>
    <div class="cc-page">
        <CcPageHeader title="稿件管理" :count="allCount">
            <CcSearchPill v-model="searchKeyword" placeholder="搜索视频名称" @search="search" />
        </CcPageHeader>

        <section class="works-panel" aria-label="稿件列表" :aria-busy="listLoading">
            <div class="works-tabs">
                <CcSegmented v-model="activeTab" :options="tabOptions" aria-label="稿件状态" />
            </div>

            <template v-if="videoList.length > 0">
                <VideoWorkRow v-for="(video, index) in videoList" :key="video.videoId ?? index" :video="video"
                    @preview="handlePreview" @edit="handleEdit" @remove="deleteVideo"
                    @toggle-interaction="toggleInteraction" />
            </template>

            <template v-else-if="listLoaded">
                <CcEmpty v-if="appliedKeyword" title="没有找到相关视频" sub="换个关键词试试" />
                <CcEmpty v-else title="这里还没有内容" />
            </template>

            <!-- 和评论、弹幕管理一样，空列表时也显示「共 0 条」 -->
            <CcPager v-if="listLoaded" :model-value="currentPage" :total="totalCount" :page-size="PAGE_SIZE"
                @update:model-value="changePage" />
        </section>

        <VideoPlayerDialog v-model:visible="previewVisible" :video-info="previewVideoInfo ?? {}"
            :file-list="previewFileList" />
    </div>
</template>

<style lang="scss" scoped>
@use '@/pages/creativeCenter/shared/styles/cc' as *;

.works-panel {
    @include panel(24px 28px 28px);
}

.works-tabs {
    display: flex;
    margin-bottom: 12px;
}
</style>
