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
import UserHomeBgImg from '../features/userHomeBgImg/ui/UserHomeBgImg.vue';
import message from '@/shared/lib/message.ts';

const hostUserDetailStore = useHostUserDetailStore();
const {
    hideUi,
    isMySelf,
    bgStyle,
    navItems,
    activeRouteName,
    keyword,
    showEditor,
    showBgImgEditor,
    currentThemeIndex,
    setPreviewWallpaper,
    searchVideos,
    subscribe,
    unsubscribe,
    navigateTo,
    viewFollowing,
    viewFollower,
    reloadUserInfo
} = useUserHome();

function saveTheme(index: number)
{
    // 更改store
    hostUserDetailStore.setTheme(index)
    // 删除预览数据
    setPreviewWallpaper(null)
    // 关闭选择壁纸界面
    showBgImgEditor.value = false
    // 提示消息
    message.success('壁纸修改成功')
}

</script>

<template>
    <div class="user-home-page" :style="bgStyle">
        <IndexHeader />
        <UserInfoEditor v-model:visible="showEditor" @reload="reloadUserInfo" />
        <UserHomeBgImg v-model:show="showBgImgEditor" :current-theme-index="currentThemeIndex"
            @preview="setPreviewWallpaper" @save-theme="saveTheme" />
        <div v-if="!hideUi" class="user-profile">
            <div class="profile">
                <img class="avatar"
                    :src="hostUserDetailStore.userHostDetail?.avatar ? imgRequestUrl(hostUserDetailStore.userHostDetail.avatar) : defaultAvatar" />
                <div class="user-detail">
                    <div class="name">
                        <div class="nickName">{{ hostUserDetailStore.userHostDetail?.nickName }}</div>
                        <img class="gender" v-if="hostUserDetailStore.userHostDetail?.gender != 2"
                            :src="hostUserDetailStore.userHostDetail?.gender == 0 ? femaleSrc : maleSrc" alt="gender">
                        <el-tooltip content="编辑个人信息" placement="top">
                            <button v-if="isMySelf" class="edit-button glass" @click="showEditor = true">
                                <img class="edit" :src="editSrc" alt="edit">
                            </button>
                        </el-tooltip>
                    </div>
                    <div class="bio">{{ hostUserDetailStore.userHostDetail?.personalIntroduction }}</div>
                </div>
            </div>
            <div class="operation">
                <el-tooltip content="隐藏界面" placement="top">
                    <button class="theme-btn glass" @click="hideUi = true">
                        <span class="iconfont icon-theme">😶‍🌫️</span>
                    </button>
                </el-tooltip>
                <el-tooltip content="更换壁纸" placement="top">
                    <button v-if="isMySelf" class="theme-btn glass" @click="showBgImgEditor = true">
                        <span class="iconfont icon-theme">🎨</span>
                    </button>
                </el-tooltip>
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
        <div v-if="!hideUi" class="main-content glass">
            <div class="top-bar">
                <div class="items">
                    <nav v-for="item in navItems" :key="item.routeName"
                        :class="[item.routePath, { active: activeRouteName === item.routeName }]"
                        @click="navigateTo(item)">
                        <span class="item-text" :class="['iconfont', item.icon]">{{ item.label }}</span>
                    </nav>
                    <input class="search" v-model="keyword" style="width:240px; margin-bottom: 10px;" placeholder="搜索视频"
                        clearable @keyup.enter="searchVideos" />
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
            <RouterView class="router-link" />
        </div>
        <div class="bottom">
        </div>
        <el-tooltip v-if="hideUi" content="显示界面" placement="top">
            <button class="hide-button glass" @click="hideUi = false">
                <span class="iconfont icon-theme">😀</span>
            </button>
        </el-tooltip>
    </div>
</template>

<style lang="scss" scoped>
$side-margin: 100px;
$avatar-size: 70px;

.user-home-page {
    min-height: 100vh;
    background-size: cover;
    background-position: center;
    background-attachment: fixed;

    overflow: hidden; // 防止出现margin塌陷

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

                    .edit-button {
                        width: 38px;
                        height: 38px;
                        border-radius: 50%;
                        border: none;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 0;
                        transition: transform 0.2s ease;

                        &:hover {
                            transform: scale(1.08);
                        }

                        &:active {
                            transform: scale(0.95);
                        }

                        .edit {
                            width: 22px;
                            height: 22px;
                            display: block;
                        }
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

            display: flex;
            align-items: center;
            column-gap: 12px;

            .theme-btn {
                width: 44px;
                height: 44px;
                border-radius: 50%;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                transition: transform 0.2s ease;

                &:hover {
                    transform: scale(1.1);
                }

                &:active {
                    transform: scale(0.95);
                }
            }

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
        margin: 30px auto;
        padding: 0 0 20px;
        border-radius: 20px;


        .top-bar {
            display: flex;
            justify-content: space-between;
            align-items: start;
            padding: 20px 30px 18px;
            margin: 15px 10px 20px;
            background-color: rgba(255, 255, 255, 0.4);
            overflow: hidden;
            border-radius: 40px;

            .items {

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

        .router-link {
            padding-left: 20px;
            padding-right: 20px;
        }
    }

}

.hide-button {
    position: fixed;
    bottom: 20px;
    right: 20px;

    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    transition: transform 0.2s ease;

    &:hover {
        transform: scale(1.1);
    }

    &:active {
        transform: scale(0.95);
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
