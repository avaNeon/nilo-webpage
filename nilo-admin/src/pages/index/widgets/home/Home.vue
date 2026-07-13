<script setup lang="ts">
import { computed } from "vue";
import { ElIcon } from "element-plus";
import { useHome } from "./composables/useHome";
import { TypeInfo } from "./model/TypeInfo";

const {
    currentDataType,
    changeDataType,
    summarizeStatistics,
    startDate,
    endDate,
    isUserDateValid,
    onUserDateConfirm,
} = useHome();

const dateRowVisible = computed(() => currentDataType.value === 0);
</script>

<template>
    <div class="home-page">
        <!-- 统计卡片 -->
        <el-card class="box-list" shadow="never">
            <div class="box-inner">
                <div v-for="type in TypeInfo" :key="type.value"
                    :class="['box-item', { active: currentDataType === type.value }]"
                    @click="changeDataType(type.value)">
                    <span class="name">
                        <el-icon style="margin-right: 10px;">
                            <component v-if="typeof type.icon !== 'string'" :is="type.icon" />
                            <i v-else :class="type.icon"></i>
                        </el-icon>
                        {{ type.name }}
                    </span>
                    <span class="count">{{ summarizeStatistics(type.value) }}</span>
                </div>
            </div>
        </el-card>

        <!-- 图表卡片 -->
        <el-card class="statistics-chart" shadow="never">
            <div class="chart-inner">
                <!-- 用户日期选择（仅选中"用户"卡片时显示） -->
                <div v-if="dateRowVisible" class="user-date-row">
                    <el-date-picker v-model="startDate" type="date" placeholder="开始日期" size="small"
                        value-format="YYYY-MM-DD" />
                    <span class="date-separator">—</span>
                    <el-date-picker v-model="endDate" type="date" placeholder="截止日期" size="small"
                        value-format="YYYY-MM-DD" />
                    <el-button size="small" type="primary" :disabled="!isUserDateValid" @click="onUserDateConfirm">
                        确定
                    </el-button>
                </div>
                <div v-else>
                    <span style="font-size: 16px;">近七天统计数据</span>
                </div>
                <div ref="chartRef" class="chart"></div>
            </div>
        </el-card>
    </div>
</template>

<style lang="scss" scoped>
.home-page {
    width: 95%;
}

.box-list {
    margin-bottom: 10px;

    .box-inner {
        display: flex;
        flex-wrap: wrap;
        column-gap: 20px;
        row-gap: 10px;

        .box-item {
            width: 240px;
            border: 1px solid $color-border;
            border-radius: 15px;
            font-weight: 600;
            font-size: 20px;

            display: flex;
            flex-direction: column;
            align-items: start;
            row-gap: 5px;
            padding: 15px;

            cursor: pointer;
            transition: all 0.25s;

            &:hover {
                border-color: $color-bilibili-blue;
            }

            &.active {
                background-color: $color-bilibili-blue;
                color: white;

                .name {
                    color: white;
                }
            }

            .name {
                display: flex;
                align-items: center;
                color: $color-mask-60;
            }
        }
    }
}

.statistics-chart {
    .chart-inner {
        padding: 10px;

        .user-date-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;

            :deep(.el-date-editor) {
                width: 140px;
            }

            .date-separator {
                color: $color-text-muted;
                font-size: 13px;
                flex-shrink: 0;
            }
        }

        .chart {
            width: 100%;
            height: 340px;
        }
    }
}
</style>
