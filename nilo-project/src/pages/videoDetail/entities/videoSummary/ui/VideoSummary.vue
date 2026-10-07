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
    /** 是否展开。开关在操作栏的「AI 总结」按钮上（见 VideoSummaryToggle），由父组件持有 */
    open: boolean,
}>()

const emit = defineEmits<{
    jump: [{ fileIndex: number, startSec: number }]
}>()

const loading = ref(false)
// null 表示还没加载过，undefined 表示这一P没有总结
const summary = ref<VideoSummary | null | undefined>(null)

// 换分P就把上一P的总结丢掉，展开状态保留，省得用户再点一次
watch(() => props.filePath, () =>
{
    summary.value = null
    if (props.open) void load()
})

// 第一次展开时才去读；收起再展开不重复读
watch(() => props.open, open =>
{
    if (open && summary.value === null) void load()
}, { immediate: true })

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

function jump(startSec: number)
{
    emit('jump', { fileIndex: props.fileIndex, startSec })
}

/** 章节卡片排成一行放不下时，滚轮直接横向滚动；已经滚到头（或根本放得下）就放行，让页面照常上下滚 */
function onRailWheel(event: WheelEvent)
{
    const rail = event.currentTarget as HTMLElement
    const max = rail.scrollWidth - rail.clientWidth
    if (max <= 0) return
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
    if ((delta < 0 && rail.scrollLeft <= 0) || (delta > 0 && rail.scrollLeft >= max - 1)) return
    event.preventDefault()
    // deltaMode：0 像素、1 行（Firefox 的鼠标滚轮）、2 页
    const pixels = event.deltaMode === 1 ? delta * 40 : event.deltaMode === 2 ? delta * rail.clientWidth : delta
    rail.scrollLeft += pixels
}
</script>

<template>
    <section v-if="open" class="video-summary">
        <div class="summary-header">
            <span class="mark" aria-hidden="true"></span>
            <span class="title">AI 总结</span>
            <span class="subtitle">根据视频内容生成，仅供参考</span>
        </div>

        <div class="panel">
            <div v-if="loading" class="tip">正在读取…</div>
            <div v-else-if="!summary" class="tip">这个视频还没有 AI 总结</div>
            <template v-else>
                <p class="text">{{ summary.summary }}</p>
                <div v-if="summary.chapters?.length" class="chapters" @wheel="onRailWheel">
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
        color: $warm-ink;
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

        // 章节：固定宽度的小卡片，从左往右排；放不下时横向滚动，滚动条在卡片下方
        .chapters {
            display: flex;
            gap: 12px;
            min-width: 0;
            // 给滚动条留出位置，不要贴着卡片
            padding-bottom: 12px;
            overflow-x: auto;
            // 滚到头不要带着整个页面一起动
            overscroll-behavior-x: contain;
            scrollbar-width: thin;
            scrollbar-color: rgba(11, 12, 18, 0.16) transparent;

            &::-webkit-scrollbar {
                height: 6px;
            }

            &::-webkit-scrollbar-track {
                background: transparent;
            }

            &::-webkit-scrollbar-thumb {
                background: rgba(11, 12, 18, 0.16);
                border-radius: 3px;

                &:hover {
                    background: rgba(11, 12, 18, 0.28);
                }
            }

            .chapter {
                display: flex;
                flex: 0 0 184px;
                flex-direction: column;
                gap: 4px;
                width: 184px;
                padding: 10px 14px;
                border-radius: 14px;
                background: #F7F8FA;
                box-shadow: inset 0 0 0 1px rgba(11, 12, 18, 0.05);
                transition: background-color 0.2s;

                &:hover {
                    background: $warm-accent-soft;
                }

                &:focus-visible {
                    outline: 2px solid $warm-accent;
                    outline-offset: -2px;
                }

                .time {
                    font-family: $warm-font-mono;
                    font-size: 12px;
                    font-weight: 500;
                    color: $warm-accent-text;
                }

                // 标题最多两行，多的省略
                .chapter-title {
                    display: -webkit-box;
                    overflow: hidden;
                    -webkit-line-clamp: 2;
                    line-clamp: 2;
                    -webkit-box-orient: vertical;
                    font-size: 13px;
                    font-weight: 600;
                    line-height: 1.5;
                    color: $warm-ink;
                }
            }
        }
    }
}
</style>
