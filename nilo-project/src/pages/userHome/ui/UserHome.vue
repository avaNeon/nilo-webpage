<script lang="ts" setup>
import { computed } from 'vue';
import { useHostUserDetailStore } from '@/shared/store/UserDetailStore';
import { imgRequestUrl } from '@/shared/utils/ImgUtil';
import IndexHeader from '@/shared/widgets/indexHeader/ui/IndexHeader.vue';
import { useUserHome } from '../composables/useUserHome';
import defaultAvatar from '@/assets/user.svg';
import maleSrc from '@/assets/icon/img/male.svg'
import femaleSrc from '@/assets/icon/img/female.svg'
import editSrc from '@/assets/icon/img/edit.svg'
const userHostUserDetailStore = useHostUserDetailStore();
const { isMySelf, subscribe, unsubscribe } = useUserHome();

// Vite 编译时加载所有背景图
const bgModules = import.meta.glob(
    '@/assets/userHome-background/*.jpg',
    { eager: true },
);

// 从文件名提取 theme 编号 → 图片 URL
const bgImageMap: Record<number, string> = {};
for (const [filePath, mod] of Object.entries(bgModules))
{
    const match = filePath.match(/background-(\d+)\.jpg$/);
    if (match)
    {
        bgImageMap[Number(match[1])] = (mod as { default: string }).default;
    }
}

/** 根据 theme 值选择对应的背景图片 */
const bgStyle = computed(() =>
{
    const theme = userHostUserDetailStore.userHostDetail?.theme ?? 1;
    const url = bgImageMap[theme];
    return url ? { backgroundImage: `url(${url})` } : {};
});

</script>

<template>
    <div class="content" :style="bgStyle">
        <IndexHeader />
        <div class="user-profile">
            <img class="avatar"
                :src="userHostUserDetailStore.userHostDetail?.avatar ? imgRequestUrl(userHostUserDetailStore.userHostDetail.avatar) : defaultAvatar" />
            <div class="user-detail">
                <div class="name">
                    <div class="nickName">{{ userHostUserDetailStore.userHostDetail?.nickName }}</div>
                    <img class="gender" v-if="userHostUserDetailStore.userHostDetail?.gender != 2"
                        :src="userHostUserDetailStore.userHostDetail?.gender == 0 ? femaleSrc : maleSrc" alt="gender">
                    <img class="edit" v-if="isMySelf" :src="editSrc" alt="edit">
                </div>
                <div class="bio">{{ userHostUserDetailStore.userHostDetail?.personalIntroduction }}</div>
            </div>
            <div class="operation">
                <div class="follow">
                    <el-dropdown class="follow-panel" v-if="userHostUserDetailStore.userHostDetail?.hasFollowed">
                        <el-button class="follow-button">
                            <span class="text">已关注</span>
                            <span class="number">{{ userHostUserDetailStore.userHostDetail?.followerCount }}</span>
                        </el-button>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item @click="unsubscribe">取消关注</el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                    <el-button v-else class="follow-button" type="primary" @click="subscribe">
                        <img class="icon" src="@/assets/plus.svg" />
                        <span class="text">关注</span>
                        <span class="number">{{ userHostUserDetailStore.userHostDetail?.followerCount }}</span>
                    </el-button>
                </div>
            </div>
        </div>
        <div class="main-content">
            <RouterView />
        </div>
    </div>
</template>

<style lang="scss" scoped>
$side-margin: 200px;
$avatar-size: 70px;

.content {
    background-size: cover;
    background-position: center;

    .user-profile {
        margin: 40px $side-margin 0;

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

        .operation {
            .follow {
                .follow-button {
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
        height: 80vh;

        margin-top: 30px;
        padding: 20px;

        background-color: white;
    }
}
</style>
