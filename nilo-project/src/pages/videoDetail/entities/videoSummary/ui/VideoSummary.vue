<script lang="ts" setup>
import { ref, watch } from 'vue'
import { publicSummaryUrl } from '@/shared/config/Minio'
import { formatDurationClock } from '@/shared/utils/DateUtil'
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
    <section :class="['video-summary', { expanded }]">
        <button type="button" class="summary-header" :aria-expanded="expanded" @click="toggle">
            <span class="mark" aria-hidden="true"></span>
            <span class="title">AI 总结</span>
            <span class="subtitle">根据视频内容生成，仅供参考</span>
            <span class="toggle-text">
                {{ expanded ? '收起' : '展开' }}
                <span class="chevron" aria-hidden="true"></span>
            </span>
        </button>

        <div v-if="expanded" class="panel">
            <div v-if="loading" class="tip">正在读取…</div>
            <div v-else-if="!summary" class="tip">这个视频还没有 AI 总结</div>
            <template v-else>
                <p class="text">{{ summary.summary }}</p>
                <div v-if="summary.chapters?.length" class="chapters">
                    <button v-for="chapter in summary.chapters" :key="chapter.startSec" type="button" class="chapter"
                        @click="jump(chapter.startSec)">
                        <span class="time">{{ formatDurationClock(chapter.startSec) }}</span>
                        <span class="chapter-title">{{ chapter.title }}</span>
                    </button>
                </div>
            </template>
        </div>
    </section>
</template>

<style lang="scss" scoped>
// 白底圆角卡片 + 内描边
.video-summary {
    padding: 22px 26px;
    border-radius: 22px;
    background: $warm-card;
    box-shadow: $warm-shadow-ring;

    &.expanded {
        padding-bottom: 20px;
    }

    button {
        border: none;
        background: none;
        font: inherit;
        text-align: left;
        cursor: pointer;
    }

    .summary-header {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 0;
        color: $warm-ink;

        &:focus-visible {
            outline: 2px solid $warm-accent;
            outline-offset: 6px;
            border-radius: 10px;
        }

        &:hover .toggle-text {
            color: $warm-accent;
        }
    }

    // 蓝色圆点标记：大圆里偏右上一个白点
    .mark {
        position: relative;
        flex-shrink: 0;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: $warm-accent;

        &::after {
            content: '';
            position: absolute;
            left: 12px;
            top: 5px;
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: #FFFFFF;
        }
    }

    .title {
        flex-shrink: 0;
        font-size: 16px;
        font-weight: 700;
    }

    .subtitle {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 12px;
        color: $warm-ink-4;
    }

    .toggle-text {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
        font-size: 12px;
        font-weight: 500;
        color: $warm-ink-3;
        transition: color 0.2s;

        .chevron {
            width: 6px;
            height: 6px;
            margin-top: -3px;
            border-right: 1.5px solid currentColor;
            border-bottom: 1.5px solid currentColor;
            transform: rotate(45deg);
            transition: transform 0.2s, margin 0.2s;
        }
    }

    &.expanded .toggle-text .chevron {
        margin-top: 3px;
        transform: rotate(-135deg);
    }

    .panel {
        display: flex;
        flex-direction: column;
        gap: 18px;
        margin-top: 18px;

        .tip {
            font-size: 13px;
            color: $warm-ink-4;
        }

        .text {
            max-width: 800px;
            margin: 0;
            font-size: 15px;
            line-height: 1.9;
            color: $warm-ink-2;
            white-space: pre-wrap;
            text-wrap: pretty;
        }

        // 章节：左侧蓝色等宽时间，点了跳过去
        .chapters {
            display: flex;
            flex-direction: column;
            gap: 2px;
            margin: 0 -12px;

            .chapter {
                display: grid;
                grid-template-columns: 64px minmax(0, 1fr);
                gap: 14px;
                padding: 12px;
                border-radius: 14px;
                transition: background-color 0.2s;

                &:hover {
                    background: $warm-sunken;
                }

                &:focus-visible {
                    outline: 2px solid $warm-accent;
                    outline-offset: -2px;
                }

                .time {
                    padding-top: 1px;
                    font-family: $warm-font-mono;
                    font-size: 13px;
                    font-weight: 500;
                    color: $warm-accent;
                }

                .chapter-title {
                    min-width: 0;
                    font-size: 14px;
                    font-weight: 700;
                    line-height: 1.6;
                    color: $warm-ink;
                }
            }
        }
    }
}
</style>
