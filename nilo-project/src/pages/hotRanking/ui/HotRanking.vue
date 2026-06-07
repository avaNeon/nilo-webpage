<script lang="ts" setup>
import { inject } from 'vue'
import IndexHeader from '@/shared/widgets/indexHeader/ui/IndexHeader.vue'
import defaultBg from '@/assets/banner-background-beach.jpg'
import { BODY_PADDING } from '@/shared/config/Config'
import VideoItem from '@/shared/entities/videoItem/ui/VideoItem.vue'
import { useHotRanking } from '../composables/useHotRanking'

// 获取内容部分最大最小宽度
const mainContentMaxWidth: number = inject('mainContentMaxWidth', 0)
const mainContentMinWidth: number = inject('mainContentMinWidth', 0)

const { hotRankingState } = useHotRanking()
</script>

<template>
    <div class="page-content" :style="{
        'max-width': mainContentMaxWidth + 'px',
        'min-width': mainContentMinWidth + 'px',
    }">
        <header>
            <div class="header" :style="{
                'background-image': `url(${defaultBg})`
            }">
                <IndexHeader />
            </div>
        </header>
        <div class="content" :style="{
            'margin-left': BODY_PADDING,
            'margin-right': BODY_PADDING,
        }">
            <div class="page-title">
                <span class="iconfont icon-hot"></span>
                24小时热榜
            </div>
            <el-empty v-if="!hotRankingState.loading && hotRankingState.videoList.length === 0" description="暂无热门视频" />
            <div v-else class="hot-video-list">
                <VideoItem v-for="(videoInfo, index) in hotRankingState.videoList" :key="videoInfo.videoId ?? index"
                    class="hot-video-item" :video-info="videoInfo" type="vertical" width="42%" />
            </div>
            <div v-if="hotRankingState.videoList.length > 0" class="load-more">
                <span>
                    {{ hotRankingState.loading ? '加载中...' : hotRankingState.finished ? '没有更多了' : '继续向下滚动加载更多' }}
                </span>
            </div>
        </div>
    </div>
</template>

<style>
body {
    background-color: rgb(197, 197, 197) !important;
}
</style>

<style lang="scss" scoped>
.page-content {
    position: relative;
    min-height: 100vh;
    background-color: white;
    margin: 0 auto;

    header {
        width: 100%;
        position: relative;

        .header {
            height: 150px;
            background: no-repeat center;
            background-size: cover;
        }
    }

    .content {
        background-color: white;
        box-sizing: border-box;
        padding: 28px 0 48px;
        display: flex;
        flex-direction: column;
        min-height: 0;

        .page-title {
            margin-bottom: 24px;
            font-size: 24px;
            font-weight: 600;
            color: $color-text-primary;
            display: flex;
            align-items: center;
            column-gap: 8px;

            .icon-hot {
                background-color: $color-hot;
                color: white;
                border-radius: 50%;
                height: 36px;
                width: 36px;
                font-size: 20px;
                line-height: 36px;
                text-align: center;
            }
        }

        .hot-video-list {
            display: flex;
            flex-wrap: wrap;
            gap: 18px;

            .hot-video-item {
                flex: 0 1 calc((100% - 18px) / 2);
                min-width: 360px;
                height: 150px;
                box-sizing: border-box;
            }
        }

        .load-more {
            display: flex;
            justify-content: center;
            margin-top: 24px;
            color: $color-text-muted;
            font-size: 14px;
        }
    }
}
</style>
