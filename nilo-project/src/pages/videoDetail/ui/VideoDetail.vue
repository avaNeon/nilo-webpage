<script lang="ts" setup>
import SiteHeader from '@/shared/widgets/siteHeader/ui/SiteHeader.vue';
import { useVideoDetail } from '../composables/useVideoDetail';
import { computed, inject, onMounted, ref } from 'vue';
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
import VideoSummaryToggle from '@/pages/videoDetail/entities/videoSummary/ui/VideoSummaryToggle.vue';
import HomeFooter from '@/pages/index/widgets/homeFooter/ui/HomeFooter.vue';

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

const AVATAR_SIZE = 46

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

interface MetaItem {
    /** 加粗显示的数字，没有就只显示 text */
    value?: string
    text: string
}

/** 标题下方的元信息，用小圆点分隔 */
const metaItems = computed((): MetaItem[] =>
{
    const videoInfo = videoStateStore.videoInfo
    const publishTime = formatBackendDateTime(videoInfo.createTime)
    const items: MetaItem[] = [
        { value: formatCount(videoInfo.playCount), text: ' 观看' },
        { value: formatCount(videoInfo.danmakuCount), text: ' 弹幕' },
        { text: publishTime ? `${publishTime} 发布` : '' },
        { text: videoInfo.postType === 1 ? '原创' : '转载' },
        { text: categoryLabel.value },
    ]
    return items.filter(item => item.value || item.text)
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

/** AI 总结是否展开：按钮在操作栏，卡片在操作栏下方，默认收起 */
const summaryOpen = ref(false)

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
                            <span class="meta-item"><span v-if="item.value" class="meta-value">{{ item.value
                            }}</span>{{ item.text }}</span>
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
                        <button v-else type="button" class="follow-button" @click="subscribe">+ 关注</button>
                    </div>
                    <VideoActionItem @action-done="() => loadVideoInfo(route.params.videoId as string)">
                        <template #leading>
                            <VideoSummaryToggle v-if="currentFilePath" :open="summaryOpen"
                                @toggle="summaryOpen = !summaryOpen" />
                        </template>
                    </VideoActionItem>
                </section>

                <!-- AI 总结：点操作栏里的「AI 总结」展开，紧跟在操作栏下方 -->
                <VideoSummary v-if="currentFilePath" class="video-summary-card" :file-path="currentFilePath"
                    :file-index="currentFileIndex" :open="summaryOpen" @jump="onAiJump" />

                <VideoIntroduction :introduction="videoStateStore.videoInfo?.introduction || ''"
                    :tags="videoStateStore.videoInfo.tags || []" />

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
                <!-- AI 助手：侧栏里的折叠卡片（悬浮球会被播放器的迷你窗挡住），默认收起 -->
                <div class="aside-card ai-assistant-card">
                    <AiAssistant embedded collapsible title="AI 视频助手" subtitle="问问这支视频"
                        :video-id="route.params.videoId as string" @jump="onAiJump" />
                </div>
                <DanmakuList v-if="isCommentAvailable()"></DanmakuList>
                <VideoPartitionList></VideoPartitionList>
                <section v-if="recommendVideoList.length > 0" class="up-next">
                    <div class="up-next-head">
                        <SectionTitle title="更多推荐" size="sm" as="h3" />
                    </div>
                    <VideoCard v-for="(videoInfo, index) in recommendVideoList" :key="videoInfo.videoId ?? index"
                        :video-info="videoInfo" layout="list" />
                </section>
            </aside>
        </main>
        <HomeFooter v-if="!loading && !notFound" divider />
        <CoinDialog @action-done="afterCoinAction" />
    </div>
</template>

<style lang="scss" scoped>
.video-page {
    display: flex;
    flex-direction: column;
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
        border-top-color: $warm-accent;
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
$first-screen-reserved: calc(#{$warm-header-height} + 1px + 8px + 56px + 36px + 48px + 14px + 18px + 24px);
// 播放器列宽按剩余高度以 16:9 反推，再夹上下限：矮屏不至于缩成小窗，宽屏也不会一直变大
$player-column-width: min(1280px, max(640px, calc((100vh - #{$first-screen-reserved}) * 16 / 9)));
$aside-width: 392px;

.video-main {
    flex: 1 0 auto;
    width: 100%;
    margin: 0 auto;
    padding: 8px 48px 104px;
    display: grid;
    grid-template-columns: minmax(0, $player-column-width) $aside-width;
    // 播放器列被限宽后，两列整体居中
    justify-content: center;
    // 第一行只由播放器撑开；侧栏跨两行时多出的高度都落到第二行
    grid-template-rows: auto 1fr;
    column-gap: 40px;
    row-gap: 36px;
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
        grid-template-columns: minmax(0, 1fr) $aside-width;

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
    gap: 28px;
    min-width: 0;
}

// ==================== 标题 ====================
.title-block {
    display: flex;
    flex-direction: column;
    gap: 14px;

    .video-title {
        margin: 0;
        font-size: 38px;
        font-weight: 800;
        line-height: 1.25;
        letter-spacing: -0.02em;
        color: $warm-ink;
        overflow-wrap: anywhere;
        text-wrap: pretty;
    }

    .video-meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
        font-size: 13px;
        color: $warm-ink-4;

        .meta-value {
            font-weight: 600;
            color: $warm-ink;
        }

        .meta-dot {
            width: 3px;
            height: 3px;
            border-radius: 50%;
            flex-shrink: 0;
            background: $warm-dot;
        }
    }
}

// ==================== UP 主 + 操作 ====================
.creator-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    padding-bottom: 24px;

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
            border-color: rgba(11, 12, 18, 0.08) !important;
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
            font-weight: 700;
            color: $warm-ink;
            transition: color 0.2s;

            &:hover {
                color: $warm-accent;
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
        margin-left: 10px;
        flex-shrink: 0;
    }

    // 蓝色胶囊，已关注时换成浅灰
    .follow-button {
        flex-shrink: 0;
        height: 40px;
        padding: 0 20px;
        border: none;
        border-radius: 999px;
        background: $warm-accent;
        color: #FFFFFF;
        font-size: 13px;
        font-weight: 600;
        white-space: nowrap;
        cursor: pointer;
        transition: background-color 0.2s, color 0.2s;

        &:hover {
            background: $warm-ink;
        }

        &:focus-visible {
            outline: 2px solid $warm-accent;
            outline-offset: 2px;
        }

        // 未关注时按钮直接跟在名字后面
        &:not(.followed) {
            margin-left: 10px;
        }

        &.followed {
            background: $warm-sunken;
            color: $warm-ink-3;
            font-weight: 500;

            &:hover {
                color: $warm-ink;
            }
        }
    }
}

// 展开的 AI 总结：操作栏下方已有 28px 的间距，往上收 8px 让卡片离分隔线近一点
.video-summary-card {
    margin-top: -8px;
}

// ==================== 评论 ====================
.comment-block {
    margin-top: 28px;

    .video-comment {
        // 翻页后滚回评论区时，别被吸顶的顶栏（含 1px 底边）挡住
        scroll-margin-top: calc(#{$warm-header-height} + 1px + 20px);
    }

    .pagination-bar {
        display: flex;
        justify-content: center;
        margin-top: 32px;
    }
}

// ==================== 侧栏 ====================
.video-aside {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
}

// 白底圆角卡片 + 内描边
.aside-card {
    border-radius: 24px;
    background: $warm-card;
    box-shadow: $warm-shadow-ring;
}

.ai-assistant-card {
    --ai-message-max-height: 320px;
}

.up-next {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 28px;

    .up-next-head {
        padding-bottom: 16px;
        border-bottom: 1px solid $warm-line;
    }
}
</style>
