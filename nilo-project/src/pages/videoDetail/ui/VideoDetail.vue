<script lang="ts" setup>
import SiteHeader from '@/shared/widgets/siteHeader/ui/SiteHeader.vue';
import { useVideoDetail } from '../composables/useVideoDetail';
import { computed, inject, onMounted } from 'vue';
import Avatar from '@/shared/entities/avatar/ui/Avatar.vue';
import { imgRequestUrl } from '@/shared/utils/ImgUtil';
import Player from '@/pages/videoDetail/features/player/ui/Player.vue';
import useVideoStateStore from '../store/VideoStateStore';
import VideoPartitionList from '@/pages/videoDetail/entities/videoPartitonList/ui/VideoPartitionList.vue';
import NotFound from '@/shared/entities/notFound/ui/NotFound.vue';
import DanmakuList from '@/pages/videoDetail/entities/danmakuList/ui/DanmakuList.vue';
import VideoActionItem from '@/pages/videoDetail/features/videoAction/ui/VideoActionItem.vue';
import CoinDialog from '@/pages/videoDetail/features/videoAction/ui/CoinDialog.vue';
import VideoIntroduction from '@/pages/videoDetail/entities/videoIntroduction/ui/VideoIntroduction.vue';
import VideoComment from '@/pages/videoDetail/widgets/videoComment/ui/VideoComment.vue';
import { useRoute } from 'vue-router';
import VideoCard from '@/shared/entities/videoCard/ui/VideoCard.vue';
import SectionTitle from '@/shared/ui/SectionTitle.vue';
import { useRecommendVideo } from '../composables/useRecommendVideo';
import { formatBackendDateTime } from '@/shared/utils/DateUtil';
import { formatCount } from '@/shared/utils/NumberUtil';
import useCategoryStore from '@/shared/store/CategoryStore';
import AiAssistant from '@/shared/features/aiAssistant/ui/AiAssistant.vue';
import VideoSummary from '@/pages/videoDetail/entities/videoSummary/ui/VideoSummary.vue';

const {
    avatarUrl,
    comments,
    firstLevelCommentCount,
    haveFollowed,
    followerCount,
    currentPage,
    PAGE_SIZE,
    loading,
    notFound,
    loadVideoInfo,
    loadMoreChildren,
    loadCommentsBySortType,
    subscribe,
    unsubscribe,
    afterCoinAction,
    pageChange,
    isCommentAvailable,
    isDanmakuAvailable,
    initLoad,
} = useVideoDetail();

const { recommendVideoList } = useRecommendVideo();
const videoStateStore = useVideoStateStore()
const categoryStore = useCategoryStore()
const route = useRoute();

// 获取内容部分最大最小宽度
const mainContentMaxWidth: number = inject('mainContentMaxWidth', 0)
const mainContentMinWidth: number = inject('mainContentMinWidth', 0)

const AVATAR_SIZE = 44

/** 分类名：有父子分类时显示「父 · 子」，找不到的分类不显示 */
const categoryLabel = computed(() =>
{
    const { categoryMap } = categoryStore
    const videoInfo = videoStateStore.videoInfo
    const category = videoInfo.categoryNumber ? categoryMap[videoInfo.categoryNumber] : undefined
    let parent = videoInfo.pCategoryNumber ? categoryMap[videoInfo.pCategoryNumber] : undefined
    if (!parent && category)
    {
        parent = categoryStore.getParentCategory(category)
    }
    const names: string[] = []
    if (parent)
    {
        names.push(parent.categoryName)
    }
    if (category && category !== parent)
    {
        names.push(category.categoryName)
    }
    return names.join(' · ')
})

/** 标题下方的元信息，用小圆点分隔 */
const metaItems = computed(() =>
{
    const videoInfo = videoStateStore.videoInfo
    return [
        `${formatCount(videoInfo.playCount)} 观看`,
        `${formatCount(videoInfo.danmakuCount)} 弹幕`,
        formatBackendDateTime(videoInfo.createTime),
        videoInfo.postType === 1 ? '原创' : '转载',
        categoryLabel.value,
    ].filter(Boolean)
})

const creator = computed(() => videoStateStore.videoInfo.userInfo ?? null)

/** 粉丝数 + 个人简介 */
const creatorSubText = computed(() =>
{
    const fans = `${formatCount(followerCount.value)} 粉丝`
    const bio = creator.value?.personalIntroduction?.trim()
    return bio ? `${fans} · ${bio}` : fans
})

/** AI 助手、AI 总结里点了片段或章节：交给播放器跳转 */
function onAiJump({ fileIndex, startSec }: { fileIndex: number; startSec: number })
{
    videoStateStore.requestSeek(fileIndex, startSec)
}

/** 当前正在看的分P。AI 总结是按分P存在 MinIO 里的 */
const currentFileIndex = computed(() => Number(route.params.index) || 1)
const currentFilePath = computed(() =>
    videoStateStore.videoFileList.find(file => file.fileIndex === currentFileIndex.value)?.filePath ?? '')

onMounted(() =>
{
    initLoad()
})

</script>

<template>
    <div class="video-page warm-theme">
        <SiteHeader />
        <NotFound v-if="notFound" title="视频不存在" hint="该视频可能已被删除或链接有误" />
        <div v-else-if="loading" class="loading-content">
            <span class="loading-spinner" role="status" aria-label="加载中"></span>
        </div>
        <main v-else :class="['video-main', videoStateStore.displayMode]" :style="{
            'max-width': mainContentMaxWidth + 'px',
            'min-width': mainContentMinWidth + 'px',
        }">
            <!-- 播放器卡片：剧场模式下横跨两列 -->
            <Player class="player-card" :danmaku-available="isDanmakuAvailable()"></Player>

            <div class="video-body">
                <!-- 标题 + 元信息 -->
                <section class="title-block">
                    <h1 class="video-title">{{ videoStateStore.videoInfo?.videoName }}</h1>
                    <div class="video-meta">
                        <template v-for="(item, index) in metaItems" :key="index">
                            <span v-if="index > 0" class="meta-dot"></span>
                            <span class="meta-item">{{ item }}</span>
                        </template>
                    </div>
                </section>

                <!-- UP 主 + 点赞投币收藏 -->
                <section class="creator-row">
                    <div class="creator">
                        <Avatar class="creator-avatar" :user-id="creator?.userId || null"
                            :src="imgRequestUrl(avatarUrl, true)" :width="AVATAR_SIZE" :lazy="true" :user-panel="false"
                            :mobile="false" :require-login="false">
                        </Avatar>
                        <div class="creator-text">
                            <RouterLink class="creator-name" :to="`/user/${creator?.userId}`" target="_blank"
                                :title="creator?.nickName ?? ''">
                                {{ creator?.nickName }}
                            </RouterLink>
                            <span class="creator-sub" :title="creatorSubText">{{ creatorSubText }}</span>
                        </div>
                        <el-dropdown v-if="haveFollowed" class="follow-dropdown">
                            <button type="button" class="follow-button followed">已关注</button>
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item @click="unsubscribe">取消关注</el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
                        <button v-else type="button" class="follow-button" @click="subscribe">关注</button>
                    </div>
                    <VideoActionItem @action-done="() => loadVideoInfo(route.params.videoId as string)" />
                </section>

                <VideoIntroduction :introduction="videoStateStore.videoInfo?.introduction || ''"
                    :tags="videoStateStore.videoInfo.tags || []" />

                <VideoSummary v-if="currentFilePath" :file-path="currentFilePath" :file-index="currentFileIndex"
                    @jump="onAiJump" />

                <section class="comment-block">
                    <VideoComment class="video-comment" :video-comments="comments" :available="isCommentAvailable()"
                        @load-more="loadMoreChildren" @load-by-sort-type="async (sortType) =>
                        {
                            currentPage = 1
                            await loadCommentsBySortType(sortType)
                        }" :comment-number="videoStateStore.videoInfo.commentCount ?? 0" />
                    <!-- 没有评论或只有一页时不显示分页 -->
                    <div v-if="isCommentAvailable() && firstLevelCommentCount > PAGE_SIZE" class="pagination-bar">
                        <el-pagination v-model:current-page="currentPage" :page-size="PAGE_SIZE" background
                            @current-change="pageChange" :total="firstLevelCommentCount" />
                    </div>
                </section>
            </div>

            <aside class="video-aside">
                <!-- AI 助手：嵌在侧栏的折叠卡片里（悬浮球会被播放器的迷你窗挡住），默认收起 -->
                <div class="ai-assistant-card">
                    <el-collapse class="collapse">
                        <el-collapse-item class="collapse-item" name="1">
                            <template #title>
                                <span class="card-title"><span class="card-dot"></span>AI 视频助手</span>
                            </template>
                            <AiAssistant embedded :video-id="route.params.videoId as string" @jump="onAiJump" />
                        </el-collapse-item>
                    </el-collapse>
                </div>
                <DanmakuList v-if="isCommentAvailable()"></DanmakuList>
                <VideoPartitionList></VideoPartitionList>
                <section v-if="recommendVideoList.length > 0" class="up-next">
                    <SectionTitle class="up-next-title" eyebrow="UP NEXT" title="接下来播放" size="sm" />
                    <VideoCard v-for="(videoInfo, index) in recommendVideoList" :key="videoInfo.videoId ?? index"
                        :video-info="videoInfo" layout="list" />
                </section>
            </aside>
        </main>
        <CoinDialog @action-done="afterCoinAction" />
    </div>
</template>

<style lang="scss" scoped>
.video-page {
    width: 100%;
    min-height: 100vh;
}

.loading-content {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 70vh;

    .loading-spinner {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 2.5px solid $warm-line;
        border-top-color: $warm-ink;
        animation: video-page-spin 0.8s linear infinite;
    }
}

@keyframes video-page-spin {
    to {
        transform: rotate(360deg);
    }
}

// 首屏要露出播放器下面的弹幕栏和标题：顶栏（含 1px 底边）+ 上边距 + 弹幕栏 + 行间距
// + 标题一行 + 标题与元信息的间距 + 元信息 + 底部留白
$first-screen-reserved: calc(#{$warm-header-height} + 1px + 28px + 56px + 26px + 38px + 10px + 18px + 24px);
// 播放器列宽按剩余高度以 16:9 反推，再夹上下限：矮屏不至于缩成小窗，宽屏也不会一直变大
$player-column-width: min(1280px, max(640px, calc((100vh - #{$first-screen-reserved}) * 16 / 9)));

.video-main {
    margin: 0 auto;
    padding: 28px 48px 96px;
    display: grid;
    grid-template-columns: minmax(0, $player-column-width) 372px;
    // 播放器列被限宽后，两列整体居中
    justify-content: center;
    // 第一行只由播放器撑开；侧栏跨两行时多出的高度都落到第二行
    grid-template-rows: auto 1fr;
    column-gap: 40px;
    row-gap: 26px;
    align-items: start;

    .player-card {
        grid-column: 1;
        grid-row: 1;
        min-width: 0;
    }

    .video-body {
        grid-column: 1;
        grid-row: 2;
    }

    .video-aside {
        grid-column: 2;
        grid-row: 1 / span 2;
    }

    // 剧场模式：播放器占满整行，侧栏移到第二行右侧
    &.theater {
        grid-template-columns: minmax(0, 1fr) 372px;

        .player-card {
            grid-column: 1 / -1;
        }

        .video-aside {
            grid-row: 2;
        }
    }
}

.video-body {
    display: flex;
    flex-direction: column;
    gap: 26px;
    min-width: 0;
}

// ==================== 标题 ====================
.title-block {
    display: flex;
    flex-direction: column;
    gap: 10px;

    .video-title {
        margin: 0;
        font-size: 28px;
        font-weight: 700;
        line-height: 1.35;
        letter-spacing: -0.01em;
        color: $warm-ink;
        overflow-wrap: anywhere;
    }

    .video-meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
        font-size: 13px;
        color: $warm-ink-4;

        .meta-dot {
            width: 2px;
            height: 2px;
            border-radius: 50%;
            flex-shrink: 0;
            background: $warm-ink-5;
        }
    }
}

// ==================== UP 主 + 操作 ====================
.creator-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    padding-bottom: 26px;
    border-bottom: 1px solid $warm-line;

    .creator {
        display: flex;
        align-items: center;
        gap: 14px;
        min-width: 0;
    }

    .creator-avatar {
        flex-shrink: 0;

        :deep(.avatar) {
            display: block;
        }

        :deep(.image-container) {
            border-color: rgba(26, 25, 22, 0.1) !important;
            background: $warm-sunken;
        }
    }

    .creator-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;

        .creator-name {
            align-self: flex-start;
            max-width: 260px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 15px;
            font-weight: 600;
            color: $warm-ink;
            transition: color 0.2s;

            &:hover {
                color: $warm-accent-hover;
            }
        }

        .creator-sub {
            max-width: 260px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 12px;
            color: $warm-ink-4;
        }
    }

    .follow-dropdown {
        margin-left: 12px;
        flex-shrink: 0;
    }

    .follow-button {
        flex-shrink: 0;
        height: 38px;
        padding: 0 18px;
        border: none;
        border-radius: 12px;
        background: $warm-ink;
        color: #FFFFFF;
        font-size: 13px;
        font-weight: 500;
        white-space: nowrap;
        cursor: pointer;
        transition: background-color 0.2s, color 0.2s, border-color 0.2s;

        &:hover {
            background: #000;
        }

        &:focus-visible {
            outline: 2px solid rgba(26, 25, 22, 0.25);
            outline-offset: 2px;
        }

        // 未关注时按钮直接跟在名字后面
        &:not(.followed) {
            margin-left: 12px;
        }

        &.followed {
            background: $warm-card;
            border: 1px solid $warm-border-strong;
            color: $warm-ink-3;

            &:hover {
                color: $warm-ink;
                border-color: rgba(26, 25, 22, 0.2);
            }
        }
    }
}

// ==================== 评论 ====================
.comment-block {
    margin-top: 20px;

    .video-comment {
        // 翻页后滚回评论区时，别被吸顶的顶栏（68px + 1px 底边）挡住
        scroll-margin-top: calc(#{$warm-header-height} + 1px + 20px);
    }

    .pagination-bar {
        display: flex;
        justify-content: center;
        margin-top: 30px;
    }
}

// ==================== 侧栏 ====================
.video-aside {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
}

.ai-assistant-card {
    .collapse {
        --el-collapse-header-height: 52px;
        --el-collapse-header-font-size: 15px;
        --el-collapse-header-text-color: #{$warm-ink};
        --el-collapse-header-bg-color: #{$warm-card};
        --el-collapse-content-bg-color: #{$warm-card};
        --el-collapse-border-color: #{$warm-line};

        border: none;
        border-radius: 18px;
        background: $warm-card;
        box-shadow: $warm-shadow-ring;
        overflow: hidden;

        :deep(.el-collapse-item:last-child) {
            margin-bottom: 0;
        }

        :deep(.el-collapse-item__header) {
            padding: 0 18px;
            font-weight: 600;
        }

        :deep(.el-collapse-item__header.is-active) {
            border-bottom-color: $warm-line;
        }

        :deep(.el-collapse-item__arrow) {
            color: $warm-ink-4;
        }

        :deep(.el-collapse-item__wrap) {
            border-bottom: none;
        }

        :deep(.el-collapse-item__content) {
            padding-bottom: 0;
        }

        // 助手面板自带的分隔线换成暖色
        :deep(.ai-assistant .panel-header),
        :deep(.ai-assistant .input-bar) {
            border-color: $warm-line;
        }
    }

    .card-title {
        display: inline-flex;
        align-items: center;
        gap: 10px;
    }

    .card-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        flex-shrink: 0;
        background: $warm-accent;
    }
}

.up-next {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin-top: 10px;

    .up-next-title {
        margin-bottom: 4px;
    }
}
</style>
