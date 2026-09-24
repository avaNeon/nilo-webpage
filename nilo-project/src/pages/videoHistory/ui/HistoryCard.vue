<script setup lang="ts">
import { imgRequestUrl } from '@/shared/utils/ImgUtil'
import { routerToNewPage } from '@/shared/utils/RouteUtil'
import { computed, ref, watch } from 'vue'
import type { VideoHistoryItem } from '../model/VideoHistoryGroup'

const props = defineProps<{
    item: VideoHistoryItem,
    /** 观看时间文案，由页面统一格式化 */
    watchedText: string,
    /** 正在删除，删除按钮先禁用 */
    deleting: boolean,
}>()

const emit = defineEmits<{
    delete: []
}>()

const history = computed(() => props.item.history)
const creator = computed(() => props.item.videoInfo.briefUserInfo)

// 带上分P，打开就是上次看的那一P
const videoPath = computed(() =>
    `/video/${history.value.videoId}${history.value.fileIndex ? `/${history.value.fileIndex}` : ''}`)
const title = computed(() => (history.value.videoName ?? '').replace(/<[^>]*>/g, ''))
const partText = computed(() => `P${history.value.fileIndex || 1}`)
const creatorName = computed(() => creator.value?.nickName || '未知UP主')

/*——————缩略图加载失败时回退原图，最终露出占位底色—————— */

const coverFailCount = ref(0)
const coverLoaded = ref(false)

const coverSrc = computed(() =>
{
    const cover = history.value.videoCover
    if (!cover) return ''
    if (coverFailCount.value === 0) return imgRequestUrl(cover, true)
    if (coverFailCount.value === 1) return imgRequestUrl(cover)
    return ''
})

watch(() => history.value.videoCover, () =>
{
    coverFailCount.value = 0
})

watch(coverSrc, () =>
{
    coverLoaded.value = false
})

function toUserPage()
{
    const userId = creator.value?.userId
    if (userId)
    {
        routerToNewPage(`/user/${userId}`)
    }
}
</script>

<template>
    <div :class="['history-card', { deleted: item.deleted }]">
        <div class="cover-wrap">
            <!-- 视频已删除：灰色占位，不可点 -->
            <span v-if="item.deleted" class="cover">
                <span class="invalid-label">视频已失效</span>
            </span>
            <RouterLink v-else class="cover" :to="videoPath" target="_blank" :aria-label="title" tabindex="-1">
                <img v-if="coverSrc" :class="{ loaded: coverLoaded }" :src="coverSrc" alt="" loading="lazy"
                    @load="coverLoaded = true" @error="coverFailCount++">
                <span :class="['part', { first: partText === 'P1' }]">{{ partText }}</span>
            </RouterLink>
            <button type="button" class="delete-button" :disabled="deleting" aria-label="删除这条历史记录"
                title="删除这条历史记录" @click="emit('delete')">
                <span class="cross" aria-hidden="true"></span>
            </button>
        </div>
        <div class="text">
            <span v-if="item.deleted" class="title">该视频已删除</span>
            <RouterLink v-else class="title" :to="videoPath" target="_blank" :title="title">{{ title }}</RouterLink>
            <span class="meta">
                <span v-if="!item.deleted" class="creator" @click="toUserPage">{{ creatorName }}</span>
                <span class="watched">观看于 {{ watchedText }}</span>
            </span>
        </div>
    </div>
</template>

<style lang="scss" scoped>
// 封面占位：冷灰渐变
$cover-placeholder: linear-gradient(160deg, oklch(0.93 0.008 265), oklch(0.83 0.014 265));

.history-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
    transition: transform 0.25s;

    &:hover {
        transform: translateY(-3px);

        .cover img {
            transform: scale(1.03);
        }

        .delete-button {
            opacity: 1;
            transform: scale(1);
        }
    }

    &:focus-within .delete-button {
        opacity: 1;
        transform: scale(1);
    }
}

.cover-wrap {
    position: relative;
}

.cover {
    position: relative;
    display: block;
    aspect-ratio: 16 / 9;
    border-radius: 16px;
    overflow: hidden;
    isolation: isolate;
    background: $cover-placeholder;

    img {
        position: absolute;
        inset: 0;
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0;
        transition: transform 0.4s ease, opacity 0.3s ease;

        &.loaded {
            opacity: 1;
        }
    }
}

// 分P：P1 墨色，其余蓝色
.part {
    position: absolute;
    left: 10px;
    top: 10px;
    display: flex;
    align-items: center;
    height: 22px;
    padding: 0 8px;
    border-radius: 999px;
    background: $warm-accent;
    color: #FFFFFF;
    font-family: $warm-font-mono;
    font-size: 11px;
    font-weight: 500;

    &.first {
        background: rgba(11, 12, 18, 0.7);
    }
}

.invalid-label {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    padding: 5px 12px;
    border-radius: 999px;
    background: rgba(11, 12, 18, 0.55);
    color: #FFFFFF;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
}

// 删除：悬停卡片时出现在封面右上角
.delete-button {
    position: absolute;
    right: 10px;
    top: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: rgba(11, 12, 18, 0.62);
    color: #FFFFFF;
    cursor: pointer;
    opacity: 0;
    transform: scale(0.9);
    transition: opacity 0.2s, transform 0.2s, background-color 0.2s;

    &:hover {
        background: $color-badge-red;
    }

    &:focus-visible {
        outline: 2px solid $warm-accent;
        outline-offset: 2px;
    }

    &:disabled {
        cursor: not-allowed;
        background: rgba(11, 12, 18, 0.4);
    }

    // 两条细线交叉成 ×
    .cross {
        position: relative;
        width: 10px;
        height: 10px;

        &::before,
        &::after {
            content: '';
            position: absolute;
            left: 50%;
            top: 50%;
            width: 12px;
            height: 1.5px;
            border-radius: 1px;
            background: currentColor;
        }

        &::before {
            transform: translate(-50%, -50%) rotate(45deg);
        }

        &::after {
            transform: translate(-50%, -50%) rotate(-45deg);
        }
    }
}

.text {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
}

.title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.5;
    color: $warm-ink;
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
        color: $warm-accent;
    }
}

.meta {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    font-size: 12px;
    color: $warm-ink-4;
    white-space: nowrap;

    .creator {
        overflow: hidden;
        text-overflow: ellipsis;
        font-weight: 500;
        color: $warm-ink-3;
        cursor: pointer;
        transition: color 0.2s;

        &:hover {
            color: $warm-accent;
        }
    }

    .watched {
        flex-shrink: 0;
    }
}

.deleted {
    .title,
    .title:hover {
        color: $warm-ink-4;
    }
}
</style>
