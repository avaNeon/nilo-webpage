<script lang="ts" setup>
import { useUserHomeFollowingList } from '../composables/useUserHomeFollowingList';
import UserItem from '@/pages/userHome/shared/ui/UserItem.vue';
import noneSrc from '@/assets/icon/img/none.svg';
import { useHostUserDetailStore } from '@/shared/store/HostUserDetailStore';

const { userList, loading, noMore, loadFollowingList } = useUserHomeFollowingList();

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
  <div class="content">
    <div class="main-content">
      <div class="label">
        <span class="theme-text">关注列表</span>
        <span class="counter-text" v-if="!loading">({{ userList.length }})</span>
      </div>

      <div v-if="userList.length > 0" class="user-items">
        <UserItem v-for="user in userList" :key="user.userId" :user="user" list-type="following" @toggle="onToggle" />
      </div>

      <div v-else-if="!loading" class="no-data">
        <img :src="noneSrc" alt="none" />
        <span>暂无关注</span>
      </div>

      <div class="pagination" v-if="userList.length > 0">
        <el-pagination layout="prev, pager, next" :page-size="10"
          :total="noMore ? userList.length : userList.length + 1"
          @current-change="(newPageNo: number) => loadFollowingList(newPageNo)" :current-page="1" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.content {
  width: 98%;
  margin: 0 auto;
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  position: relative;
  padding-bottom: 70px;

  display: flex;
  flex-direction: column;

  .main-content {
    display: flex;
    flex-direction: column;
    padding: 10px 20px;

    .label {
      display: flex;
      column-gap: 10px;
      align-items: baseline;
      margin: 10px 0;

      .theme-text {
        font-size: 20px;
        font-weight: 500;
      }

      .counter-text {
        color: $color-text-secondary;
        font-size: 16px;
      }
    }

    .user-items {
      display: flex;
      flex-direction: column;
    }

    .no-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;

      img {
        width: 100px;
        margin-bottom: 12px;
      }

      span {
        color: $color-text-secondary;
        font-size: 14px;
      }
    }

    .pagination {
      position: absolute;
      bottom: 20px;

      :deep(.el-pager li),
      :deep(.btn-prev),
      :deep(.btn-next) {
        background-color: rgba(255, 255, 255, 0.5);
        border-radius: 50%;
        margin: 0 3px;
      }
    }
  }
}
</style>
