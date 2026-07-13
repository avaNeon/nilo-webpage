<script lang="ts" setup>
import { TypeInfo } from '../model/TypeInfo';
import { useCcHome } from '../model/useCcHome';


const {
    currentDataType,
    changeDataType,
    summarizeStatistics
} = useCcHome()
</script>

<template>
    <div class="content">
        <el-card class="box-list">
            <div class="box-inner">
                <div v-for="type in TypeInfo" :class="['box-item', currentDataType == type.value ? 'active' : '']"
                    @click="changeDataType(type.value)">
                    <div :class="['name', type.icon]">{{ type.name }}</div>
                    <div class="count">{{ summarizeStatistics(type.value) }}</div>
                </div>
            </div>
        </el-card>
        <el-card class="statistics-chart">
            <div class="chart-inner">
                <div class="chart" ref="chartRef"></div>
            </div>
        </el-card>
    </div>
</template>

<style lang="scss" scoped>
.content {
    margin: 30px 130px 0;

    .box-list {
        margin-bottom: 20px;

        .box-inner {
            display: flex;
            flex-wrap: wrap;
            column-gap: 30px;
            row-gap: 15px;

            .box-item {
                width: 220px;
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

                &.active {
                    background-color: $color-bilibili-blue;

                    color: white;

                    .name {
                        color: white;
                    }
                }

                .name {
                    color: $color-mask-60;

                    &::first-letter {
                        margin-right: 10px;
                    }
                }
            }
        }
    }

    .statistics-chart {
        .chart-inner {
            padding: 10px;

            .chart {
                width: 100%;
                height: 350px;
            }
        }
    }
}
</style>