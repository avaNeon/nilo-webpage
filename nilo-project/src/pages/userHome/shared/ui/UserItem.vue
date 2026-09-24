<script lang="ts" setup>
import { computed, ref } from 'vue';
import { imgRequestUrl } from '@/shared/utils/ImgUtil';
import { FollowApi } from '@/shared/api/FollowApi';
import defaultAvatar from '@/assets/user.svg';
import type { FollowUserInfo } from '@/pages/userHome/shared/model/FollowUserInfo';

const props = defineProps<{
    user: FollowUserInfo;
    listType: 'follower' | 'following';
}>();

const emit = defineEmits<{
    (e: 'toggle', userId: string, followed: boolean): void;
}>();

const pending = ref(false);
const avatarFailed = ref(false);

const avatarSrc = computed(() =>
    props.user.avatar && !avatarFailed.value ? imgRequestUrl(props.user.avatar, true) : defaultAvatar)

const hintLabel = computed(() =>
{
    if (props.listType === 'follower')
    {
        return props.user.followed ? '已互关' : '';
    }
    return props.user.following ? '已互关' : '';
});

const buttonText = computed(() =>
{
    if (props.user.followed)
    {
        return '取消关注';
    }
    return props.listType === 'follower' ? '回关' : '关注';
});

async function handleToggle()
{
    if (pending.value) return;

    pending.value = true;
    try
    {
        await FollowApi.follow(props.user.userId);
        emit('toggle', props.user.userId, !props.user.followed);
    }
    finally
    {
        pending.value = false;
    }
}
</script>

<template>
    <div class="user-item-row">
        <RouterLink :to="`/user/${user.userId}`" target="_blank" class="user-link">
            <img class="avatar" :src="avatarSrc" alt="" loading="lazy" @error="avatarFailed = true">
            <span class="info">
                <span class="nick-name">{{ user.nickName }}</span>
                <span class="intro">{{ user.personalIntroduction || '这个人很神秘，什么都没有写' }}</span>
            </span>
        </RouterLink>

        <div class="right-section">
            <span v-if="hintLabel" class="hint-label">{{ hintLabel }}</span>
            <button type="button" :class="['follow-button', { followed: user.followed }]" :disabled="pending"
                @click="handleToggle">
                {{ buttonText }}
            </button>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@use '@/pages/userHome/shared/styles/glass' as *;

.user-item-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 12px 16px 12px 12px;
    border-radius: 20px;
    transition: background-color 0.2s;

    &:hover {
        background: $glass-hover;
    }
}

.user-link {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
    color: $warm-ink;
    text-decoration: none;

    &:hover .nick-name {
        color: $warm-accent;
    }
}

.avatar {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
    background: $glass-placeholder;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.8);
}

.info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;

    .nick-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 15px;
        font-weight: 700;
        transition: color 0.2s;
    }

    .intro {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 13px;
        color: $warm-ink-3;
    }
}

.right-section {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;

    .hint-label {
        font-size: 12px;
        color: $warm-ink-3;
    }
}

// 未关注：蓝色实心；已关注：白雾
.follow-button {
    @include reset-button;
    display: flex;
    align-items: center;
    height: 36px;
    padding: 0 18px;
    border-radius: 999px;
    background: $warm-accent;
    color: #FFFFFF;
    font-size: 13px;
    font-weight: 600;
    transition: background-color 0.2s, color 0.2s, opacity 0.2s;

    &.followed {
        @include glass-chip;
        color: $warm-ink-3;

        &:hover:not(:disabled) {
            background: #FFFFFF;
        }
    }

    &:disabled {
        opacity: 0.6;
    }
}
</style>
