<script lang="ts" setup>
import IndexHeader from '@/shared/widgets/indexHeader/ui/IndexHeader.vue';
import { useVideoDetail } from '../composables/useVideoDetail';
import { VIDEO_PAGE_SIDE_PADDING } from '@/shared/config/Config';
import { inject, onMounted } from 'vue';
import Avatar from '@/shared/entities/avatar/ui/Avatar.vue';
import { imgRequestUrl } from '@/shared/utils/ImgUtil';
import Account from '@/shared/features/account/ui/Account.vue';
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
import VideoItem from '@/shared/entities/videoItem/ui/VideoItem.vue';
import { useRecommendVideo } from '../composables/useRecommendVideo';

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
const route = useRoute();

// 获取内容部分最大最小宽度
const mainContentMaxWidth: number = inject('mainContentMaxWidth', 0)
const mainContentMinWidth: number = inject('mainContentMinWidth', 0)

const avatarSize = 60

onMounted(() =>
{
    initLoad()
})

</script>

<template>
    <Account />
    <CoinDialog @action-done="afterCoinAction" />
    <div v-if="notFound" class="not-found-page">
        <header class="header" :style="{
            'max-width': mainContentMaxWidth + 'px',
            'min-width': mainContentMinWidth + 'px',
        }">
            <IndexHeader theme="dark" />
        </header>
        <NotFound title="视频不存在" hint="该视频可能已被删除或链接有误" />
    </div>
    <div v-else-if="loading" class="loading-page">
        <header class="header" :style="{
            'max-width': mainContentMaxWidth + 'px',
            'min-width': mainContentMinWidth + 'px',
        }">
            <IndexHeader theme="dark" />
        </header>
        <div class="loading-content">
            <img src="@/assets/loading.gif" alt="Loading..." />
        </div>
    </div>
    <div v-else :class="['page-content', videoStateStore.displayMode]" :style="{
        'max-width': mainContentMaxWidth + 'px',
        'min-width': mainContentMinWidth + 'px',
    }">
        <header class="header" :style="{
            'max-width': mainContentMaxWidth + 'px',
            'min-width': mainContentMinWidth + 'px',
        }">
            <IndexHeader theme="dark" />
        </header>
        <div class="video-content" :style="{
            'paddingLeft': VIDEO_PAGE_SIDE_PADDING + 'px',
            'paddingRight': VIDEO_PAGE_SIDE_PADDING + 'px',
        }">
            <div class="top-content">
                <div class="left">
                    <div class="video-title">{{ videoStateStore.videoInfo?.videoName }}</div>
                    <div class="video-info">
                        <div class="iconfont icon-play2">{{ videoStateStore.videoInfo?.playCount }}</div>
                        <div class="iconfont icon-danmu">{{ videoStateStore.videoInfo?.danmakuCount }}</div>
                        <div class="iconfont">{{ videoStateStore.videoInfo?.createTime }}</div>
                        <div class="post-type">
                            {{ videoStateStore.videoInfo.postType === 1 ? '原创' : '转载' }}
                        </div>
                    </div>
                </div>
                <div class="right">
                    <div class="user-info">
                        <Avatar class="avatar" :style="{
                            'height': avatarSize + 'px',
                        }" :user-id="videoStateStore.videoInfo?.userInfo?.userId || null"
                            :src="imgRequestUrl(avatarUrl)" :width="avatarSize" :lazy="true" :user-panel="false"
                            :mobile="false" :require-login="false">
                        </Avatar>
                        <div class="user-detail">
                            <RouterLink class="user-name-router-link"
                                :to="`/user/${videoStateStore.videoInfo?.userInfo?.userId}`" target="_blank">
                                <span class="user-name" :title="videoStateStore.videoInfo?.userInfo?.nickName ?? ''">
                                    {{ videoStateStore.videoInfo?.userInfo?.nickName }}
                                </span>
                            </RouterLink>
                            <span class="user-bio"
                                :title="videoStateStore.videoInfo?.userInfo?.personalIntroduction ?? 'no bio now'">
                                {{ videoStateStore.videoInfo?.userInfo?.personalIntroduction || 'no bio now' }}
                            </span>
                            <div class="follow">
                                <el-dropdown class="follow-panel" v-if="haveFollowed">
                                    <el-button class="follow-button">
                                        <span class="text">已关注</span>
                                        <span class="number">{{ followerCount }}</span>
                                    </el-button>
                                    <template #dropdown>
                                        <el-dropdown-menu>
                                            <el-dropdown-item @click="unsubscribe">取消关注</el-dropdown-item>
                                        </el-dropdown-menu>
                                    </template>
                                </el-dropdown>
                                <el-button v-else class="follow-button" type="primary" @click="subscribe">
                                    <img class="icon" src="@/assets/plus.svg" />
                                    <span class="text">关注</span>
                                    <span class="number">{{ followerCount }}</span>
                                </el-button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="content-body">
                <div class="player-area">
                    <Player :danmaku-available="isDanmakuAvailable()"></Player>
                </div>
                <div class="action-area">
                    <VideoActionItem @action-done="() => loadVideoInfo(route.params.videoId as string)" />
                    <VideoIntroduction :introduction="videoStateStore.videoInfo?.introduction || ''"
                        :tags="videoStateStore.videoInfo.tags || []" />
                    <div class="comment-list">
                        <VideoComment class="video-comment" :video-comments="comments" :available="isCommentAvailable()"
                            @load-more="loadMoreChildren" @load-by-sort-type="async (sortType) =>
                            {
                                currentPage = 1
                                await loadCommentsBySortType(sortType)
                            }" :comment-number="videoStateStore.videoInfo.commentCount ?? 0" />
                        <el-pagination v-if="isCommentAvailable()" class="pagination" v-model:current-page="currentPage"
                            :page-size="PAGE_SIZE" background @current-change="pageChange"
                            :total="firstLevelCommentCount" />
                    </div>
                </div>
                <div class="sidebar">
                    <DanmakuList v-if="isCommentAvailable()" class="danmaku-list"></DanmakuList>
                    <VideoPartitionList></VideoPartitionList>
                    <div v-if="recommendVideoList.length > 0" class="recommend-video-list">
                        <VideoItem v-for="(videoInfo, index) in recommendVideoList" :key="videoInfo.videoId ?? index"
                            class="recommend-video-item" :video-info="videoInfo" type="vertical" width="40%" title-font-size="16px" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
$title-font-size: 26px;
$info-font-size: 16px;

$left-content-max-width: 70%;
$right-content-max-width: 28%;

.not-found-page {
    min-height: 100vh;
    background-color: white;

    .header {
        position: sticky;
        top: 0;
        z-index: 600;
        width: 100%;
    }
}

.loading-page {
    min-height: 100vh;
    background-color: white;

    .header {
        position: sticky;
        top: 0;
        z-index: 600;
        width: 100%;
    }

    .loading-content {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 70vh;

        img {
            width: 60px;
            height: auto;
        }
    }
}

.page-content {
    min-height: 150vh;
    background-color: white;

    .header {
        position: sticky;
        top: 0;
        z-index: 600;
        width: 100%;

    }

    .video-content {
        margin-top: 20px;

        .top-content {
            display: flex;
            justify-content: space-between;

            .left,
            .right {
                flex: 1;

                transition: max-width 0.2s ease, opacity 0.2s ease;
            }

            .left {
                max-width: $left-content-max-width;

                .video-title {
                    font-size: $title-font-size;
                    font-weight: 500;
                }

                .video-info {
                    display: flex;
                    column-gap: 10px;

                    .iconfont {
                        color: $color-text-secondary;
                        font-size: $info-font-size;

                        &.icon-play2,
                        &.icon-danmu {
                            &::before {
                                margin-right: 4px;
                            }
                        }
                    }

                    .post-type {
                        display: inline-block;
                        font-size: 14px;
                        font-weight: 500;
                        color: $color-text-secondary;

                        padding: 3px 9px;
                        background-color: $color-shadow-sm;
                        border-radius: 25px;
                    }
                }
            }

            .right {
                max-width: $right-content-max-width;

                .user-info {
                    display: flex;
                    column-gap: 20px;
                    align-items: center;

                    .user-detail {
                        width: 100%;

                        display: flex;
                        flex-direction: column;
                        row-gap: 3px;

                        text-wrap: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;

                        .user-name-router-link {
                            text-decoration: none;

                            .user-name {
                                font-size: 18px;
                                line-height: 18px;
                                font-weight: 500;
                                color: black;

                                &:hover {
                                    opacity: 0.7;
                                }
                            }
                        }

                        .user-bio {
                            font-size: 14px;
                            line-height: 14px;
                        }

                        .follow {
                            width: 100%;
                            margin-top: 4px;

                            .follow-panel {
                                width: 100%;
                            }

                            .follow-button {
                                width: 100%;
                                display: flex;
                                align-items: center;

                                .icon {
                                    width: 14px;
                                    height: 14px;
                                }

                                .text {
                                    margin: 0 8px;
                                }
                            }
                        }
                    }
                }
            }

        }

        .content-body {
            margin: 10px 0;

            display: grid;
            grid-template-columns: $left-content-max-width $right-content-max-width;
            column-gap: 2%;
            align-items: start;

            .player-area {
                grid-column: 1;
                grid-row: 1;
                margin-bottom: 40px;
            }

            .action-area {
                grid-column: 1;
                grid-row: 2;
                margin-top: 40px;

                .comment-list {
                    margin: 40px 0;

                    .video-comment {
                        margin: 20px 0;
                    }

                    .pagination {
                        margin-top: 30px;
                    }
                }
            }

            .sidebar {
                grid-column: 2;
                grid-row: 1 / span 2;

                .danmaku-list {
                    margin-bottom: 10px;
                }

                .recommend-video-list {
                    margin-top: 12px;
                    display: flex;
                    flex-direction: column;
                    row-gap: 12px;

                    :deep(.recommend-video-item.video.vertical) {
                        flex: 0 0 96px;
                        height: 96px;
                        min-height: 96px;
                    }
                }
            }
        }
    }

    &.theater>.video-content {

        .top-content {
            column-gap: 20px;

            .right {
                max-width: 30%;
            }
        }

        .content-body {
            .player-area {
                grid-column: 1 / span 2;
                grid-row: 1;
            }

            .action-area {
                grid-column: 1;
                grid-row: 2;
            }

            .sidebar {
                grid-column: 2;
                grid-row: 2;
                margin-top: 20px;
                max-height: 600px;
                overflow: hidden;
            }
        }
    }
}
</style>
