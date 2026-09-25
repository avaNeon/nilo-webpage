<script lang="ts" setup>
import CcPageHeader from '@/pages/creativeCenter/shared/ui/CcPageHeader.vue';
import { useCcHome } from '../model/useCcHome';
import DailyTrendChart from './DailyTrendChart.vue';

const {
    currentDataType,
    statCards,
    dateRangeText,
    currentTypeName,
    chartPoints,
    chartSumText,
    changeDataType,
} = useCcHome()
</script>

<template>
    <div class="cc-page">
        <CcPageHeader title="数据概览">
            <template v-if="dateRangeText" #default>
                <span class="date-range">{{ dateRangeText }}</span>
            </template>
        </CcPageHeader>

        <section class="overview-panel">
            <!-- 7 个指标卡片，点哪个下面的图表就看哪个 -->
            <div class="stat-grid">
                <button v-for="card in statCards" :key="card.value" type="button"
                    :class="['stat-card', { active: card.value === currentDataType }]"
                    :aria-pressed="card.value === currentDataType" @click="changeDataType(card.value)">
                    <span class="stat-label">{{ card.name }}</span>
                    <span class="stat-number">{{ card.main }}</span>
                    <span class="stat-sub">{{ card.sub }}</span>
                </button>
            </div>

            <div class="chart-section">
                <div class="chart-header">
                    <div class="chart-title-group">
                        <span class="chart-title">{{ currentTypeName }}</span>
                        <span class="chart-caption">近 7 天每日新增</span>
                    </div>
                    <span class="chart-sum">7 日合计 <span class="chart-sum-value">{{ chartSumText }}</span></span>
                </div>
                <div class="chart-body">
                    <DailyTrendChart :label="currentTypeName" :points="chartPoints" />
                </div>
            </div>
        </section>
    </div>
</template>

<style lang="scss" scoped>
@use '@/pages/creativeCenter/shared/styles/cc' as *;

/* 标题右侧的日期范围，只展示不能点 */
.date-range {
    @include mono(12px);
    display: flex;
    align-items: center;
    height: 40px;
    padding: 0 16px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.14);
    color: #FFFFFF;
    white-space: nowrap;
}

.overview-panel {
    @include panel(28px, 32px);
    display: flex;
    flex-direction: column;
    gap: 28px;
}

/*——————指标卡片—————— */

.stat-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 10px;
}

.stat-card {
    @include reset-button;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
    min-width: 0;
    padding: 18px 14px 16px 16px;
    border-radius: 22px;
    background: $cc-soft;
    color: $warm-ink;
    text-align: left;
    transition: background-color 0.2s;

    &:hover {
        background: $warm-accent-soft;
    }

    &.active {
        background: $warm-accent;
        color: #FFFFFF;
        box-shadow: 0 16px 30px -16px rgba(0, 0, 242, 0.8);

        .stat-label,
        .stat-sub {
            color: $warm-accent-on-dark-2;
        }
    }
}

.stat-label {
    font-size: 13px;
    font-weight: 600;
    color: $warm-ink-4;
}

.stat-number {
    overflow: hidden;
    font-size: 26px;
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.15;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.stat-sub {
    @include mono(11px);
    overflow: hidden;
    color: $warm-ink-4;
    white-space: nowrap;
    text-overflow: ellipsis;
}

/*——————近 7 天图表—————— */

.chart-section {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.chart-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
    padding: 0 4px;
}

.chart-title-group {
    display: flex;
    align-items: baseline;
    gap: 12px;
}

.chart-title {
    font-size: 20px;
    font-weight: 800;
    letter-spacing: -0.01em;
}

.chart-caption {
    font-size: 13px;
    color: $warm-ink-4;
}

.chart-sum {
    font-size: 13px;
    color: $warm-ink-3;
    white-space: nowrap;
}

.chart-sum-value {
    font-weight: 700;
    color: $warm-accent;
}

.chart-body {
    padding: 8px 4px 0;
}
</style>
