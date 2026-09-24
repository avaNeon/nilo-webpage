<script lang="ts" setup>
import { useUserHomeFollowingList } from '../composables/useUserHomeFollowingList';
import FollowUserList from '@/pages/userHome/shared/ui/FollowUserList.vue';
import { useHostUserDetailStore } from '@/shared/store/HostUserDetailStore';

const { userList, loading, noMore, loadMore } = useUserHomeFollowingList();

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
    <FollowUserList title="关注" :count="hostUserDetailStore.userHostDetail?.followingCount ?? null" empty-text="还没有关注任何人"
        list-type="following" :user-list="userList" :loading="loading" :no-more="noMore" @toggle="onToggle"
        @load-more="loadMore" />
</template>
