<script lang="ts" setup>
import { Search } from '@element-plus/icons-vue';
import DanmakuTable from './DanmakuTable.vue';
import { useDanmakuManagement } from '../model/useDanmakuManagement';
import message from '@/shared/lib/message';

const {
    searchKeyword,
    danmakuCount,
    danmakuList,
    currentPage,
    pageSize,
    hasVideoId,
    handlePageNoChange,
    handlePageSizeChange,
    handleDanmakuDeleted,
} = useDanmakuManagement();

async function onDanmakuDeleted(danmakuId: string)
{
    const ok = await handleDanmakuDeleted(danmakuId);
    if (ok)
    {
        message.success("删除成功");
    }
}
</script>

<template>
    <div id="danmaku-management-top" class="content">
        <div class="top">
            <div class="title">
                <span class="title-text">弹幕管理
                    <span class="count-text" v-if="danmakuCount > 0">({{ danmakuCount }})</span>
                </span>
            </div>
            <div class="search" v-if="!hasVideoId">
                <el-input :suffix-icon="Search" placeholder="搜索视频名称" v-model="searchKeyword"></el-input>
            </div>
        </div>
        <div class="main-content">
            <DanmakuTable class="table" :danmaku-list="danmakuList" :total-count="danmakuCount" :show-pagination="true"
                :current-page="currentPage" :page-size="pageSize" @change-page-no="handlePageNoChange"
                @change-page-size="handlePageSizeChange" @danmaku-deleted="onDanmakuDeleted" />
        </div>
    </div>
</template>

<style lang="scss" scoped>
.content {
    .top {
        margin: 30px 40px 20px;

        display: flex;
        justify-content: space-between;
        align-items: center;

        .title {
            .title-text {
                font-size: 18px;
                font-weight: 500;

                .count-text {
                    font-size: 16px;
                    font-weight: 400;
                    color: $color-text-secondary;
                }
            }
        }

        .search {
            width: 300px;
        }
    }

    .main-content {
        margin-top: 10px;
    }
}
</style>
