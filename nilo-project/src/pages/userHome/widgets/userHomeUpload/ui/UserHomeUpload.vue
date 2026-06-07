<script lang="ts" setup>
import { useUserHomeUpload } from '../composables/useUserHomeUpload';
import VideoItem from '@/shared/entities/videoItem/ui/VideoItem.vue';
import noneSrc from "@/assets/icon/img/none.svg"

const {
    SortTypes,
    sortTypeValue,
    count,
    pageNo,
    pageSize,
    videoList,
    loadVideos,
    changeSortType,
} = useUserHomeUpload()
</script>
<template>
    <div class="content">
        <div class="top-bar">
            <div class="type-items">
                <div :class="['type-item', sortTypeValue === sortType.value ? 'active' : '']"
                    v-for="sortType in SortTypes" @click="changeSortType(sortType.value)">
                    {{ sortType.label }}
                </div>
            </div>
        </div>
        <div class="main-content">
            <div class="label">
                <span class="theme-text">TA的视频</span>
                <span class="counter-text">({{ count ?? 0 }})</span>
            </div>
            <div v-if="count !== 0" class="video-items">
                <div class="video-item" v-for="videoItem in videoList">
                    <VideoItem class="item" :video-info="videoItem" type="horizontal" />
                </div>
            </div>
            <div v-else class="no-data">
                <img :src="noneSrc" alt="none">
                <span>没有视频</span>
            </div>
            <div v-if="count !== 0" class="pagination">
                <el-pagination layout="prev, pager, next" :total="count" :page-size="pageSize"
                    @current-change="(newPageNo: number) => loadVideos(newPageNo)" :current-page="pageNo" />
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
    // 给分页器留出空间
    padding-bottom: 70px;

    display: flex;
    flex-direction: column;

    .top-bar {
        padding: 10px 20px;

        .type-items {

            display: flex;
            align-items: center;
            column-gap: 20px;

            .type-item {
                cursor: pointer;

                padding-bottom: 10px;
                border-radius: 15px;

                padding: 5px 15px;

                font-size: 16px;
                font-weight: 500;

                backdrop-filter: blur(18px) saturate(160%);
                -webkit-backdrop-filter: blur(18px) saturate(160%);
                border: 1px solid rgba(255, 255, 255, 0.35);
                box-shadow:
                    0 8px 30px rgba(0, 0, 0, 0.12),
                    inset 0 1px 0 rgba(255, 255, 255, 0.45);

                &.active {
                    color: white;
                    border: none;
                    background-color: $color-bilibili-blue-80;
                }
            }
        }
    }

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
