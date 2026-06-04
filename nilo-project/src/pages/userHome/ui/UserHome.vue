<script lang="ts" setup>
import { useHostUserDetailStore } from '@/shared/store/HostUserDetailStore.ts';
import { imgRequestUrl } from '@/shared/utils/ImgUtil';
import IndexHeader from '@/shared/widgets/indexHeader/ui/IndexHeader.vue';
import { useUserHome } from '../composables/useUserHome';
import defaultAvatar from '@/assets/user.svg';
import maleSrc from '@/assets/icon/img/male.svg'
import femaleSrc from '@/assets/icon/img/female.svg'
import editSrc from '@/assets/icon/img/edit.svg'
import UserInfoEditor from '../features/userInfoEditor/ui/UserInfoEditor.vue';

const hostUserDetailStore = useHostUserDetailStore();
const { isMySelf, bgStyle, navItems, activeRouteName, keyword, showEditor, subscribe, unsubscribe, navigateTo, viewFollowing, viewFollower, reloadUserInfo } = useUserHome();


</script>

<template>
    <div class="content" :style="bgStyle">
        <IndexHeader />
        <UserInfoEditor v-model:visible="showEditor" @reload="reloadUserInfo" />
        <div class="user-profile">
            <div class="profile">
                <img class="avatar"
                    :src="hostUserDetailStore.userHostDetail?.avatar ? imgRequestUrl(hostUserDetailStore.userHostDetail.avatar) : defaultAvatar" />
                <div class="user-detail">
                    <div class="name">
                        <div class="nickName">{{ hostUserDetailStore.userHostDetail?.nickName }}</div>
                        <img class="gender" v-if="hostUserDetailStore.userHostDetail?.gender != 2"
                            :src="hostUserDetailStore.userHostDetail?.gender == 0 ? femaleSrc : maleSrc" alt="gender">
                        <img class="edit" v-if="isMySelf" :src="editSrc" alt="edit" @click="showEditor = true">
                    </div>
                    <div class="bio">{{ hostUserDetailStore.userHostDetail?.personalIntroduction }}</div>
                </div>
            </div>
            <div class="operation">
                <div class="follow">
                    <el-dropdown class="follow-panel" v-if="hostUserDetailStore.userHostDetail?.hasFollowed">
                        <el-button class="follow-button" size="large">
                            <span class="text">已关注</span>
                            <span class="number">{{ hostUserDetailStore.userHostDetail?.followerCount }}</span>
                        </el-button>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item @click="unsubscribe">取消关注</el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                    <el-button v-else class="follow-button" size="large" type="primary" @click="subscribe">
                        <img class="icon" src="@/assets/plus.svg" />
                        <span class="text">关注</span>
                        <span class="number">{{ hostUserDetailStore.userHostDetail?.followerCount }}</span>
                    </el-button>
                </div>
            </div>
        </div>
        <div class="main-content glass">
            <div class="top-bar">
                <div class="items">
                    <nav v-for="item in navItems" :key="item.routeName"
                        :class="[item.routePath, { active: activeRouteName === item.routeName }]"
                        @click="navigateTo(item)">
                        <span class="item-text" :class="['iconfont', item.icon]">{{ item.label }}</span>
                    </nav>
                    <input class="search" v-model="keyword" style="width:240px; margin-bottom: 10px;" placeholder="搜索视频"
                        clearable />
                </div>
                <div class="countable-info">
                    <div :class="['count-item', 'folllowing-count', isMySelf ? 'active' : '']" @click="viewFollowing">
                        <div class="count-text">关注数</div>
                        <div class="count-number">
                            {{ hostUserDetailStore.userHostDetail != null ?
                                hostUserDetailStore.userHostDetail.followingCount : '-' }}
                        </div>
                    </div>
                    <div :class="['count-item', 'folllower-count', isMySelf ? 'active' : '']" @click="viewFollower">
                        <div class="count-text">粉丝数</div>
                        <div class="count-item count-number">
                            {{ hostUserDetailStore.userHostDetail != null ?
                                hostUserDetailStore.userHostDetail.followerCount : '-' }}
                        </div>
                    </div>
                    <div class="count-item folllowing-count">
                        <div class="count-text">获赞量</div>
                        <div class="count-number">
                            {{ hostUserDetailStore.userHostDetail != null ?
                                hostUserDetailStore.userHostDetail.likeCount : '-' }}
                        </div>
                    </div>
                    <div class="folllower-count">
                        <div class="count-text">播放数</div>
                        <div class="count-item count-number">
                            {{ hostUserDetailStore.userHostDetail != null ?
                                hostUserDetailStore.userHostDetail.playCount : '-' }}
                        </div>
                    </div>
                </div>
            </div>
            <RouterView />
        </div>
    </div>
</template>

<style lang="scss" scoped>
$side-margin: 100px;
$avatar-size: 70px;

.content {
    min-height: 100vh;
    background-size: cover;
    background-position: center;
    background-attachment: fixed;

    .user-profile {
        width: 90%;
        margin: 40px auto 0;

        display: flex;
        justify-content: space-between;
        align-items: end;

        .profile {

            display: flex;
            align-items: center;
            column-gap: 30px;

            .avatar {
                background-color: white;
                width: $avatar-size;
                border-radius: 50%;
            }

            .user-detail {
                width: 500px;

                display: flex;
                flex-direction: column;
                row-gap: 10px;

                text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.4);

                .name {
                    display: flex;
                    align-items: center;
                    column-gap: 15px;

                    .nickName {
                        font-size: 28px;
                        font-weight: bold;
                        color: white;
                    }

                    .gender {
                        width: 30px;
                    }

                    .edit {
                        cursor: pointer;
                        width: 30px;
                    }
                }


                .bio {
                    font-size: 16px;
                    color: white;
                }
            }
        }

        .operation {
            margin-right: 40px;

            .follow {
                .follow-button {
                    width: 160px;

                    .icon {
                        width: 14px;
                        margin-right: 6px;
                    }

                    .text {
                        margin-right: 6px;
                    }
                }
            }
        }
    }



    .main-content {
        width: 90%;
        margin: 30px auto 0;
        padding: 20px 15px;
        border-top-left-radius: 20px;
        border-top-right-radius: 20px;

        .top-bar {
            display: flex;
            justify-content: space-between;
            align-items: start;
            padding: 0 10px;

            .items {
                margin: 0 10px 15px;

                display: flex;
                column-gap: 30px;
                align-items: center;

                .icon-home::before {
                    color: $color-badge-green;
                }

                .icon-play::before {
                    color: $color-bilibili-blue;
                }

                .icon-playlist::before {
                    color: $color-badge-blue;
                }

                .icon-collection::before {
                    color: $color-badge-orange;
                }

                nav {

                    cursor: pointer;
                    padding-bottom: 10px;
                    border-bottom: 2px solid transparent;

                    transition: border-bottom 0.3s ease;

                    &:hover,
                    &.active {
                        border-bottom: 2px solid $color-bilibili-blue;

                        .item-text {
                            color: $color-bilibili-blue;
                        }
                    }

                    &.active {
                        .item-text {
                            font-weight: 600;
                        }
                    }

                    .item-text {
                        font-size: 16px;
                        font-weight: 500;

                        transition: color 0.3s ease;

                        &::before {
                            font-weight: 600;
                            margin-right: 10px;
                        }
                    }
                }

                .search {
                    height: 30px;
                    background-color: rgba(255, 255, 255, 0.4);
                    border-radius: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.4);
                    padding: 5px 10px;

                    &:focus {
                        outline: none;
                        border: 1px solid $color-bilibili-blue;
                        box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.18);
                    }
                }
            }

            .countable-info {
                display: flex;
                column-gap: 30px;
                align-items: center;

                .count-item {
                    font-weight: 500;

                    display: flex;
                    flex-direction: column;
                    align-items: center;

                    &.active {
                        cursor: pointer;

                        color: $color-bilibili-blue;
                    }
                }
            }
        }
    }
}

.glass {
    background: rgba(255, 255, 255, 0.18);
    backdrop-filter: blur(18px) saturate(160%);
    -webkit-backdrop-filter: blur(18px) saturate(160%);
    border: 1px solid rgba(255, 255, 255, 0.35);
    box-shadow:
        0 8px 30px rgba(0, 0, 0, 0.12),
        inset 0 1px 0 rgba(255, 255, 255, 0.45);
}
</style>
