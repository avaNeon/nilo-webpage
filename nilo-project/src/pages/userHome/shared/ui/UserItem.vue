<script lang="ts" setup>
import { computed } from 'vue';
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

const hintLabel = computed(() =>
{
    if (props.listType === 'follower')
    {
        return props.user.followed ? '已互关' : '';
    }
    return props.user.following ? '该用户已互关' : '';
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
    await FollowApi.follow(props.user.userId);
    const newFollowed = !props.user.followed;
    emit('toggle', props.user.userId, newFollowed);
}
</script>

<template>
    <div class="user-item-row">
        <RouterLink :to="`/user/${user.userId}`" target="_blank" class="left-section">
            <img class="avatar" :src="user.avatar ? imgRequestUrl(user.avatar, true) : defaultAvatar" :alt="user.nickName" />
            <div class="info">
                <span class="nick-name">{{ user.nickName }}</span>
                <span class="intro">{{ user.personalIntroduction }}</span>
            </div>
        </RouterLink>

        <div class="right-section">
            <span v-if="hintLabel" class="hint-label">{{ hintLabel }}</span>
            <el-button :class="user.followed ? 'follow-btn glass--default' : 'follow-btn glass--primary'" size="small"
                @click.stop="handleToggle">
                {{ buttonText }}
            </el-button>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.user-item-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-radius: 10px;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
        background-color: rgba(255, 255, 255, 0.4);
    }

    .left-section {
        display: flex;
        align-items: center;
        column-gap: 16px;
        text-decoration: none;
        flex: 1;
        min-width: 0;
        overflow: hidden;

        .avatar {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            object-fit: cover;
            flex-shrink: 0;
            border: 1px solid rgba(255, 255, 255, 0.5);
            background-color: white;
        }

        .info {
            display: flex;
            flex-direction: column;
            row-gap: 4px;
            overflow: hidden;

            .nick-name {
                font-size: 15px;
                font-weight: 600;
                color: #222;
            }

            .intro {
                font-size: 13px;
                color: $color-text-secondary;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        }
    }

    .right-section {
        display: flex;
        align-items: center;
        column-gap: 10px;
        flex-shrink: 0;
        margin-left: 16px;

        .hint-label {
            font-size: 14px;
            color: $color-bilibili-blue;
            font-weight: 500;
            white-space: nowrap;
        }

        .follow-btn {
            position: relative;
            min-width: 76px;
            height: 30px;
            padding: 0 16px;
            overflow: hidden;
            border: 1px solid transparent;
            border-radius: 999px;
            font-weight: 600;
            --el-button-hover-border-color: transparent;
            --el-button-active-border-color: transparent;
            background:
                linear-gradient(135deg, rgba(255, 255, 255, 0.38), rgba(255, 255, 255, 0.14)) padding-box,
                linear-gradient(135deg,
                    rgba(255, 255, 255, 0.9),
                    rgba(0, 174, 236, 0.42) 34%,
                    rgba(255, 255, 255, 0.2) 62%,
                    rgba(255, 255, 255, 0.72)) border-box;
            backdrop-filter: blur(14px) saturate(170%);
            -webkit-backdrop-filter: blur(14px) saturate(170%);
            box-shadow:
                0 8px 18px rgba(0, 0, 0, 0.08),
                inset 0 1px 0 rgba(255, 255, 255, 0.72),
                inset 0 -12px 20px rgba(255, 255, 255, 0.12);
            transition:
                transform 0.18s ease,
                box-shadow 0.18s ease,
                background 0.18s ease;

            &::before {
                content: "";
                position: absolute;
                inset: 1px 8px auto;
                height: 45%;
                border-radius: inherit;
                background: linear-gradient(180deg, rgba(255, 255, 255, 0.64), rgba(255, 255, 255, 0));
                pointer-events: none;
            }

            &:hover,
            &:focus {
                transform: translateY(-1px);
                box-shadow:
                    0 10px 22px rgba(0, 174, 236, 0.16),
                    inset 0 1px 0 rgba(255, 255, 255, 0.82),
                    inset 0 -12px 22px rgba(255, 255, 255, 0.18);
            }

            &:active {
                transform: translateY(0);
            }

            :deep(span) {
                position: relative;
                z-index: 200;
            }
        }

        .glass--primary {
            color: #fff;
            --el-button-text-color: #fff;
            --el-button-hover-text-color: #fff;
            --el-button-active-text-color: #fff;
            border-color: $color-bilibili-blue;
            background: $color-bilibili-blue;
            box-shadow: 0 6px 14px rgba(0, 174, 236, 0.18);

            &::before {
                display: none;
            }

            &:hover,
            &:focus {
                background: #15b7ef;
                box-shadow: 0 8px 18px rgba(0, 174, 236, 0.22);
            }
        }

        .glass--default {
            color: #4f5b66;
            background:
                linear-gradient(135deg, rgba(255, 255, 255, 0.34), rgba(255, 255, 255, 0.12)) padding-box,
                linear-gradient(135deg,
                    rgba(255, 255, 255, 0.82),
                    rgba(170, 186, 198, 0.38) 38%,
                    rgba(255, 255, 255, 0.18) 62%,
                    rgba(255, 255, 255, 0.62)) border-box;
        }

    }
}
</style>
