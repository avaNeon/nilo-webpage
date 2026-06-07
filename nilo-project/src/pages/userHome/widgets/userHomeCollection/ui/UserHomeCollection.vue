<script lang="ts" setup>
import { useUserHomeCollection } from "../composables/useUserHomeCollection";
import VideoItem from "@/shared/entities/videoItem/ui/VideoItem.vue";
import noneSrc from "@/assets/icon/img/none.svg"

const {
    count,
    pageNo,
    pageSize,
    videoList,
    loadCollection,
} = useUserHomeCollection()
</script>
<template>
    <div class="content">
        <div class="main-content">
            <div class="label">
                <span class="theme-text">TA的收藏</span>
                <span class="counter-text">({{ count ?? 0 }})</span>
            </div>
            <div v-if="count !== 0" class="video-items">
                <div class="video-item" v-for="(videoItem, index) in videoList" :key="videoItem.videoId ?? index">
                    <VideoItem class="item" :video-info="videoItem" type="horizontal" date-description="收藏于 · " :date="videoItem.collectDate as string" />
                </div>
            </div>
            <div v-else class="no-data">
                <img :src="noneSrc" alt="none">
                <span>此用户暂时没有收藏视频</span>
            </div>
            <div v-if="count !== 0" class="pagination">
                <el-pagination layout="prev, pager, next" :total="count" :page-size="pageSize"
                    @current-change="(newPageNo: number) => loadCollection(newPageNo)" :current-page="pageNo" />
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.content {
    width: 98%;
    margin: 0 auto;
    padding: 10px;
    background-color: rgba(255, 255, 255, 0.3);
    border-radius: 20px;
    position: relative;
    padding-bottom: 70px;

    display: flex;
    flex-direction: column;

    .main-content {
        display: flex;
        flex-direction: column;
        padding: 10px 20px;

        .label {
            display: flex;
            column-gap: 10px;
            align-items: baseline;
            margin: 10px 0;

            .theme-text {
                font-size: 20px;
                font-weight: 500;
            }

            .counter-text {
                color: $color-text-secondary;
                font-size: 16px;
            }
        }

        .video-items {
            display: flex;
            flex-wrap: wrap;
            justify-content: start;
            column-gap: 20px;
            row-gap: 20px;

            .video-item {
                width: 265px;
                height: 200px;

                .item {
                    background-color: rgba(255, 255, 255, 0.5);
                    border: 1px solid rgba(255, 255, 255, 0.35);
                    box-shadow:
                        0 8px 30px rgba(0, 0, 0, 0.12),
                        inset 0 1px 0 rgba(255, 255, 255, 0.45);
                }
            }
        }

        .no-data {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .pagination {
            position: absolute;
            bottom: 20px;

            :deep(.el-pager li),
            :deep(.btn-prev),
            :deep(.btn-next) {
                background-color: rgba(255, 255, 255, 0.5);
                border-radius: 50%;
                margin: 0 3px;
            }
        }
    }
}
</style>
