<script lang="ts" setup>
import { Search } from "@element-plus/icons-vue";
import UserTable from "./UserTable.vue";
import { useUserManagement } from "../composables/useUserManagement";

const {
    nickNameKeyword,
    emailKeyword,
    selectedStatus,
    statusOptions,
    userCount,
    userList,
    currentPage,
    pageSize,
    loading,
    handleSearch,
    handlePageNoChange,
    handlePageSizeChange,
    handleUserStatusChanged,
} = useUserManagement();
</script>

<template>
    <div class="user-management">
        <!-- ─── 上卡片：筛选区 ─── -->
        <el-card class="filter-card" shadow="never">
            <div class="filter-row">
                <div class="filter-title">
                    用户管理
                    <span v-if="userCount > 0" class="count-text">({{ userCount }})</span>
                </div>
                <div class="filter-actions">
                    <el-input v-model="nickNameKeyword" :suffix-icon="Search" placeholder="搜索昵称" clearable
                        class="filter-input" @keyup.enter="handleSearch" />
                    <el-input v-model="emailKeyword" :suffix-icon="Search" placeholder="搜索邮箱" clearable
                        class="filter-input" @keyup.enter="handleSearch" />
                    <el-select v-model="selectedStatus" placeholder="账户状态" clearable class="filter-select">
                        <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label"
                            :value="opt.value" />
                    </el-select>
                    <el-button type="primary" @click="handleSearch">查询</el-button>
                </div>
            </div>
        </el-card>

        <!-- ─── 下卡片：用户列表表格 ─── -->
        <el-card class="table-card" shadow="never">
            <UserTable :user-list="userList" :total-count="userCount" :loading="loading" :current-page="currentPage"
                :page-size="pageSize" @change-page-no="handlePageNoChange" @change-page-size="handlePageSizeChange"
                @user-status-changed="handleUserStatusChanged" />
        </el-card>
    </div>
</template>

<style lang="scss" scoped>
.user-management {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;

    .filter-card {
        :deep(.el-card__body) {
            padding: 16px 20px;
        }

        .filter-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            flex-wrap: wrap;
        }

        .filter-title {
            font-size: 18px;
            font-weight: 500;
            color: $color-text-primary;
            white-space: nowrap;

            .count-text {
                font-size: 16px;
                font-weight: 400;
                color: $color-text-secondary;
            }
        }

        .filter-actions {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
        }

        .filter-input {
            width: 220px;
        }

        .filter-select {
            width: 140px;
        }
    }

    .table-card {
        :deep(.el-card__body) {
            padding: 0;
        }
    }
}
</style>
