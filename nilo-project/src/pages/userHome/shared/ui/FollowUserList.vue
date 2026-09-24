<script lang="ts" setup>
import GlassSection from './GlassSection.vue';
import GlassEmpty from './GlassEmpty.vue';
import UserItem from './UserItem.vue';
import type { FollowUserInfo } from '../model/FollowUserInfo';

defineProps<{
    title: string,
    count: number | null,
    emptyText: string,
    listType: 'follower' | 'following',
    userList: FollowUserInfo[],
    loading: boolean,
    noMore: boolean,
}>()

const emit = defineEmits<{
    (e: 'toggle', userId: string, followed: boolean): void,
    (e: 'loadMore'): void,
}>()
</script>

<template>
    <!-- 粉丝 / 关注列表：两列用户行，底部加载更多 -->
    <GlassSection :title="title" :count="count">
        <template #title>
            <RouterLink :to="{ name: 'userHomeIndex' }" class="back-button">← 主页</RouterLink>
            <h2 class="list-title">{{ title }}</h2>
        </template>

        <div v-if="userList.length > 0" class="user-grid">
            <UserItem v-for="user in userList" :key="user.userId" :user="user" :list-type="listType"
                @toggle="(userId, followed) => emit('toggle', userId, followed)" />
        </div>
        <GlassEmpty v-else-if="!loading" :title="emptyText" />

        <button v-if="userList.length > 0 && !noMore" type="button" class="load-more-button" :disabled="loading"
            @click="emit('loadMore')">
            {{ loading ? '加载中…' : '加载更多' }}
        </button>
        <span v-else-if="loading && userList.length === 0" class="list-end">加载中…</span>
    </GlassSection>
</template>

<style lang="scss" scoped>
@use '@/pages/userHome/shared/styles/glass' as *;

.back-button {
    @include glass-chip-button(36px);
    flex-shrink: 0;
    align-self: center;
    color: $warm-ink;
    text-decoration: none;
}

.list-title {
    margin: 0;
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.015em;
}

.user-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 4px 14px;
}

.load-more-button {
    @include glass-chip-button(46px);
    align-self: center;
    padding: 0 26px;
    font-size: 14px;
}

.list-end {
    align-self: center;
    font-size: 12px;
    color: $warm-ink-3;
}
</style>
