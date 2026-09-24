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
            <span class="heading">
                <span class="eyebrow">AI SUMMARY</span>
                <span class="title">AI 总结</span>
            </span>
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
.video-summary {
    padding: 20px 22px;
    border-radius: 18px;
    background: $warm-card;
    box-shadow: $warm-shadow-ring;

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
        justify-content: space-between;
        gap: 16px;
        width: 100%;
        padding: 0;
        color: $warm-ink;

        &:focus-visible {
            outline: 2px solid rgba(26, 25, 22, 0.2);
            outline-offset: 6px;
            border-radius: 10px;
        }

        &:hover .toggle-text {
            color: $warm-ink;
        }
    }

    .heading {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .eyebrow {
        font-family: $warm-font-mono;
        font-size: 11px;
        letter-spacing: 0.14em;
        color: $warm-ink-4;
    }

    .title {
        font-size: 16px;
        font-weight: 700;
        color: $warm-ink;
    }

    .toggle-text {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
        font-size: 13px;
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
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid $warm-line;

        .tip {
            font-size: 13px;
            color: $warm-ink-4;
        }

        .text {
            margin: 0;
            font-size: 14px;
            line-height: 1.8;
            color: $warm-ink-2;
            white-space: pre-wrap;
            text-wrap: pretty;
        }

        .chapters {
            display: flex;
            flex-direction: column;
            gap: 2px;
            margin: 14px -10px 0;

            .chapter {
                display: flex;
                align-items: baseline;
                gap: 14px;
                padding: 8px 10px;
                border-radius: 10px;
                transition: background-color 0.2s;

                &:hover {
                    background: $warm-paper;
                }

                &:focus-visible {
                    outline: 2px solid rgba(26, 25, 22, 0.2);
                    outline-offset: -2px;
                }

                .time {
                    flex-shrink: 0;
                    min-width: 44px;
                    font-family: $warm-font-mono;
                    font-size: 12px;
                    color: $warm-accent-text;
                }

                .chapter-title {
                    min-width: 0;
                    font-size: 14px;
                    line-height: 1.6;
                    color: $warm-ink;
                }
            }
        }
    }
}
</style>
