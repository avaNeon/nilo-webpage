<script lang="ts" setup>
import UserHomeSeries from "@/pages/userHome/entities/userHomeSeries/ui/UserHomeSeries.vue";
import UserHomeVideoList from "@/pages/userHome/entities/userHomeVideoList/ui/UserHomeVideoList.vue";
import { useHostUserDetailStore } from "@/shared/store/HostUserDetailStore";

const hostUserDetailStore = useHostUserDetailStore();
</script>

<template>
    <div class="content">
        <div class="left">
            <div class="left-item">
                <UserHomeVideoList />
            </div>
            <div class="left-item">
                <UserHomeSeries />
            </div>
        </div>
        <div class="right">
            <div class="right-item notification">
                <div class="right-title">
                    公告
                </div>
                <div class="right-content">
                    {{ hostUserDetailStore.userHostDetail?.noticeInfo }}
                </div>
            </div>
            <div class="right-item user-detail">
                <div class="right-title">
                    个人资料
                </div>
                <div class="right-content user-detail-content">
                    <div>
                        UID: {{ hostUserDetailStore.userHostDetail?.userId }}
                    </div>
                    <div v-if="hostUserDetailStore.userHostDetail?.birthday">
                        生日: {{ hostUserDetailStore.userHostDetail?.birthday }}
                    </div>
                    <div v-if="hostUserDetailStore.userHostDetail?.school">
                        学校: {{ hostUserDetailStore.userHostDetail?.school }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.content {
    width: 100%;
    padding: 5px;

    display: flex;
    justify-content: space-between;

    .left {
        width: 82%;
        display: flex;
        flex-direction: column;
        row-gap: 20px;

        .left-item {
            
            background-color: rgba(255, 255, 255, 0.3);
            border-radius: 15px;
            padding: 10px;
        }
    }

    .right {
        display: flex;
        flex-direction: column;
        row-gap: 20px;
        width: 17%;

        .right-item {
            background-color: rgba(255, 255, 255, 0.6);
            border-radius: 15px;
            padding: 15px;

            .right-title {
                font-size: 16px;
                font-weight: 500;
                color: $color-text-primary;

                border-bottom: 1px solid $color-mask-40;
                padding-bottom: 10px;
            }

            .right-content {
                color: $color-text-secondary;
                font-size: 14px;

                margin-top: 10px;
            }
        }

        .user-detail>.user-detail-content {
            display: flex;
            flex-direction: column;
            row-gap: 10px;
        }
    }
}
</style>