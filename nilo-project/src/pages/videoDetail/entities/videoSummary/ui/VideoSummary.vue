<script lang="ts" setup>
import { ref, watch } from 'vue'
import { publicSummaryUrl } from '@/shared/config/Minio'
import { calculateDuration } from '@/shared/utils/DateUtil'
import type { VideoSummary } from '../model/VideoSummary'

const props = defineProps<{
    /** 当前分P在 MinIO 里的目录 */
    filePath: string,
    /** 当前是第几P，章节跳转要用 */
    fileIndex: number,
}>()

const emit = defineEmits<{
    jump: [{ fileIndex: number, startSec: number }]
}>()

const expanded = ref(false)
const loading = ref(false)
// null 表示还没加载过，undefined 表示这一P没有总结
const summary = ref<VideoSummary | null | undefined>(null)

// 换分P就把上一P的总结丢掉，展开状态保留，省得用户再点一次
watch(() => props.filePath, () =>
{
    summary.value = null
    if (expanded.value) void load()
})

/** 总结是转码时算好的静态文件，直接从 MinIO 读，不经过后端 */
async function load()
{
    const url = publicSummaryUrl(props.filePath)
    if (!url) return
    loading.value = true
    try
    {
        const response = await fetch(url)
        summary.value = response.ok ? await response.json() : undefined
    }
    catch
    {
        summary.value = undefined
    }
    finally
    {
        loading.value = false
    }
}

function toggle()
{
    expanded.value = !expanded.value
    if (expanded.value && summary.value === null) void load()
}

function jump(startSec: number)
{
    emit('jump', { fileIndex: props.fileIndex, startSec })
}
</script>

<template>
    <div class="video-summary">
        <button class="toggle" :class="{ active: expanded }" @click="toggle">
            <span class="label">AI 总结</span>
            <span class="arrow">{{ expanded ? '收起' : '展开' }}</span>
        </button>

        <div v-if="expanded" class="panel">
            <div v-if="loading" class="tip">正在读取…</div>
            <div v-else-if="!summary" class="tip">这个视频还没有 AI 总结</div>
            <template v-else>
                <p class="text">{{ summary.summary }}</p>
                <div v-if="summary.chapters?.length" class="chapters">
                    <button v-for="chapter in summary.chapters" :key="chapter.startSec" class="chapter"
                        @click="jump(chapter.startSec)">
                        <span class="time">{{ calculateDuration(Math.floor(chapter.startSec)) }}</span>
                        <span class="title">{{ chapter.title }}</span>
                    </button>
                </div>
            </template>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.video-summary {
    margin: 10px 0;

    .toggle {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 14px;
        border: none;
        border-radius: 16px;
        background-color: #f5f5f5;
        color: #333;
        font-size: 14px;
        cursor: pointer;

        &:hover,
        &.active {
            background-color: #e6f2ff;
            color: #00a1d6;
        }

        .arrow {
            font-size: 12px;
            color: #999;
        }
    }

    .panel {
        margin-top: 8px;
        padding: 12px 14px;
        border-radius: 10px;
        background-color: #f5f5f5;

        .tip {
            font-size: 13px;
            color: #999;
        }

        .text {
            margin: 0;
            font-size: 14px;
            line-height: 1.7;
            color: #333;
            white-space: pre-wrap;
        }

        .chapters {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 10px;

            .chapter {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 4px 10px;
                border: none;
                border-radius: 12px;
                background-color: #fff;
                font-size: 13px;
                color: #333;
                cursor: pointer;

                &:hover {
                    color: #00a1d6;
                }

                .time {
                    color: #00a1d6;
                    font-variant-numeric: tabular-nums;
                }
            }
        }
    }
}
</style>
