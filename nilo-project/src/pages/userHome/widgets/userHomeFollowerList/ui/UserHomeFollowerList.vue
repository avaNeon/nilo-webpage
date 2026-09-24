<script lang="ts" setup>
import { useUserHomeFollowerList } from '../composables/useUserHomeFollowerList';
import FollowUserList from '@/pages/userHome/shared/ui/FollowUserList.vue';
import { useHostUserDetailStore } from '@/shared/store/HostUserDetailStore';

const { userList, loading, noMore, loadMore } = useUserHomeFollowerList();

const hostUserDetailStore = useHostUserDetailStore();

function onToggle(userId: string, followed: boolean)
{
    const target = userList.value.find(u => u.userId === userId);
    if (target)
    {
        target.followed = followed;
        if (hostUserDetailStore.userHostDetail)
        {
            hostUserDetailStore.userHostDetail.followingCount += followed ? 1 : -1;
        }
    }
}
</script>

<template>
    <FollowUserList title="粉丝" :count="hostUserDetailStore.userHostDetail?.followerCount ?? null" empty-text="还没有粉丝"
        list-type="follower" :user-list="userList" :loading="loading" :no-more="noMore" @toggle="onToggle"
        @load-more="loadMore" />
</template>
