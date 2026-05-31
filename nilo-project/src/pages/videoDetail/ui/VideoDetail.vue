<script lang="ts" setup>
import IndexHeader from '@/widgets/indexHeader/ui/IndexHeader.vue';
import { useVideoDetail } from '../composables/useVideoDetail';
import { VIDEO_PAGE_SIDE_PADDING } from '@/shared/config/Config';
import { inject, onMounted } from 'vue';
import Avatar from '@/entities/avatar/ui/Avatar.vue';
import { imgRequestUrl } from '@/shared/utils/ImgUtil';
import Account from '@/features/account/ui/Account.vue';
import Player from '@/features/player/ui/Player.vue';
import useVideoStateStore from '../store/VideoStateStore';
import VideoPartitionList from '@/entities/videoPartitonList/ui/VideoPartitionList.vue';
import DanmakuList from '@/entities/danmakuList/ui/DanmakuList.vue';
import VideoActionItem from '@/features/videoAction/ui/VideoActionItem.vue';
import CoinDialog from '@/features/videoAction/ui/CoinDialog.vue';
import VideoIntroduction from '@/entities/videoIntroduction/ui/VideoIntroduction.vue';
import VideoComment from '@/widgets/videoComment/ui/VideoComment.vue';
import { useRoute } from 'vue-router';

const {
    avatarUrl,
    comments,
    firstLevelCommentCount,
    haveFollowed,
    followerCount,
    currentPage,
    PAGE_SIZE,
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
    <div :class="['page-content', videoStateStore.displayMode]" :style="{
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
                            :mobile="false">
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

            <div class="main-content">
                <div class="left">
                    <Player :danmaku-available="isDanmakuAvailable()"></Player>
                </div>
                <div class="right">
                    <DanmakuList v-if="isCommentAvailable()" class="danmaku-list"></DanmakuList>
                    <VideoPartitionList></VideoPartitionList>
                </div>
            </div>

            <!-- only display in theater mode -->
            <div class="bottom-content">
                <div class="left">
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
                <div class="right">
                    <DanmakuList class="danmaku-list"></DanmakuList>
                    <VideoPartitionList></VideoPartitionList>
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

.page-content {
    min-height: 150vh;
    background-color: white;

    .header {
        position: sticky;
        top: 0;
        z-index: 200;
        width: 100%;

        z-index: 300;
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

        .main-content {
            margin: 10px 0;

            display: flex;
            justify-content: space-between;

            .left {
                flex: 1;

                max-width: $left-content-max-width;
            }

            .right {
                flex: 1;

                max-width: $right-content-max-width;

                .danmaku-list {
                    margin-bottom: 10px;
                }
            }

        }

        .bottom-content {
            margin-top: 40px;

            display: flex;
            justify-content: space-between;

            .left {
                margin-top: 15px;
                flex: 1;

                max-width: $left-content-max-width;
                transition: height 0.2s ease;

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

            .right {
                flex: 1;

                display: flex;
                flex-direction: column;
                row-gap: 10px;

                max-width: $right-content-max-width;
                max-height: 0;
                overflow: hidden;
                opacity: 0;
                transition: max-height 0.2s ease, opacity 0.2s ease, margin-top 0.2s ease;
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

        .main-content {

            .left {
                max-width: 100%;
            }

            .right {
                max-width: 0%;
                opacity: 0;
            }
        }

        .bottom-content {
            .right {
                max-height: 600px;
                opacity: 1;
                margin-top: 20px;
            }
        }
    }
}
</style>
