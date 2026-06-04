<script lang="ts" setup>
import VideoItem from '@/shared/entities/videoItem/ui/VideoItem.vue';
import { useVideoSeriesEditor } from '../model/useVideoSeriesEditor';
import message from '@/shared/lib/message';
import { watch } from 'vue';
import noneSrc from "@/assets/icon/img/none.svg"
import type { VideoInfo } from '@/shared/model/VideoInfo';


const props = defineProps<{
    visible: boolean;
    seriesId?: string;
    title?: string;
    description?: string;
    existedVideoList?: string[];
    maxVideosNumber?: number;
}>();

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: "submit", seriesId: string | undefined, seriesName: string,
        seriesDescription: string,
        videoIdList: string[],): void;
}>();

const {
    title,
    description,
    step,
    videoList,
    addedVideoList,
    seriesId,
    excludedVideoCount,
    addedVideoLength,
    loadNextPageVideos,
    validateForm,
    clear,
    addVideo,
    removeVideo,
    loadAvailableVideoCount,
} = useVideoSeriesEditor()

function handleVideoItemsScroll(event: Event)
{
    const el = event.currentTarget as HTMLElement | null

    if (!el) return

    const bottomThreshold = 32
    const reachedBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - bottomThreshold

    if (reachedBottom)
    {
        loadNextPageVideos()
    }
}

function handleCheckboxToggle(videoId: string | null | undefined, checked: unknown)
{
    if (!videoId) return

    if (checked === true)
    {
        addVideo(videoId)
        moveVideoToAddedArea(videoId)
    }
    else
    {
        removeVideo(videoId)
        addedVideoLength.value = Math.max(addedVideoLength.value - 1, 0)
    }
}

function moveVideoToAddedArea(videoId: string)
{
    const index = videoList.value.findIndex(video => video.videoId === videoId)

    if (index < 0) return

    const [selectedVideo] = videoList.value.splice(index, 1)
    videoList.value.splice(addedVideoLength.value, 0, selectedVideo as VideoInfo)
    addedVideoLength.value++
}

function handleSubmit()
{
    if (addedVideoList.value.length === 0)
    {
        message.warning("请至少选择一个视频")
        return;
    }
    emit('submit', seriesId.value, title.value, description.value, addedVideoList.value)
    clear()
    emit('update:visible', false)
}


function handleNextStep()
{
    validateForm()
    loadAvailableVideoCount()
}

/**
 * 处理传入的props
 */
function assemblePropsData()
{
    seriesId.value = props.seriesId
    title.value = props.title ?? ''
    description.value = props.description ?? ''
    addedVideoList.value = props.existedVideoList ? [...props.existedVideoList] : []
}

watch(
    () => [
        props.seriesId,
        props.title,
        props.description,
        props.existedVideoList,
        props.visible,
    ],
    assemblePropsData,
    { immediate: true },
)

</script>
<template>
    <el-dialog :model-value="visible" append-to-body @update:model-value="emit('update:visible', false)" @closed="clear"
        width="600">
        <div v-if="step === 1" class="dialog-content">
            <div class="serie-name-input">
                <span class="name-label must">系列名称</span>
                <el-input placeholder="请输入系列名称" v-model="title" style="width: 300px;" maxlength="100" show-word-limit />
            </div>
            <div class="serie-description-input">
                <span class="description-label">系列简介</span>
                <el-input placeholder="请输入系列简介" v-model="description" style="width: 300px;" maxlength="300"
                    type="textarea" show-word-limit />
            </div>
            <div class="buttons">
                <el-button @click="emit('update:visible', false)">取消</el-button>
                <el-button type="primary" @click="handleNextStep">下一步</el-button>
            </div>
        </div>
        <div v-else-if="step === 2" class="select-videos">
            <div class="video-count">
                <span class="count-title">添加视频</span>
                <span class="count-text">已添加{{ addedVideoList.length }}/{{ maxVideosNumber }}个视频</span>
            </div>
            <div v-if="!seriesId || videoList.length > 0 || excludedVideoCount !== 0" class="video-items"
                @scroll="handleVideoItemsScroll">
                <div class="select-item" v-for="(video, index) in videoList" :key="video.videoId ?? index">
                    <div class="toggle">
                        <el-checkbox class="video-checkbox"
                            :model-value="!!video.videoId && addedVideoList.includes(video.videoId)"
                            @change="handleCheckboxToggle(video.videoId, $event)" />
                    </div>
                    <video-item class="video-item" :video-info="video" type="vertical" width="36%" />
                </div>
            </div>
            <div v-else class="no-data">
                <img :src="noneSrc" alt="none">
                <span>所有的视频已经添加！</span>
            </div>
            <div class="buttons">
                <el-button @click="step = 1">上一步</el-button>
                <el-button type="primary" @click="handleSubmit">创建</el-button>
            </div>
        </div>
    </el-dialog>
</template>

<style lang="scss" scoped>
.dialog-content {
    display: flex;
    flex-direction: column;
    row-gap: 30px;

    .serie-name-input,
    .serie-description-input {
        display: flex;
        column-gap: 15px;
        align-items: start;

        font-size: 14px;
    }

    .name-label,
    .description-label {
        width: 80px;
    }

    .buttons {
        display: flex;
        justify-content: end;
        column-gap: 15px;
    }
}

.select-videos {
    display: flex;
    flex-direction: column;
    row-gap: 10px;

    .video-count {
        padding: 5px 10px;

        display: flex;
        flex-direction: column;
        row-gap: 5px;

        .count-title {
            font-size: 16px;
            font-weight: 500;
        }

        .count-text {
            font-size: 16px;
            font-weight: 400;
            color: $color-text-secondary;
        }
    }

    .video-items {
        padding: 20px 40px;
        height: 500px;
        overflow-y: scroll;

        .select-item {
            display: flex;

            .toggle {
                width: 18%;

                display: flex;
                justify-content: center;
                align-items: center;

                .video-checkbox {
                    margin-right: 0;

                    :deep(.el-checkbox__inner) {
                        width: 18px;
                        height: 18px;

                        border: 1px solid $color-mask-40;
                        border-radius: 4px;
                    }

                    :deep(.el-checkbox__inner::after) {
                        width: 4px;
                        height: 9px;
                    }
                }
            }

            .video-item {
                width: 80%;
                height: 80px;

                pointer-events: none;
            }
        }

    }

    .no-data {
        padding: 20px 40px;

        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    .buttons {
        display: flex;
        justify-content: end;
        column-gap: 15px;
    }
}

.must {
    &::after {
        content: '*';
        color: red;
    }
}
</style>
