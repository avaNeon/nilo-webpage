<script setup lang="ts">
import SectionTitle from '@/shared/ui/SectionTitle.vue'
import { HOT_TOPIC_COUNT, useHotTopics } from '../model/useHotTopics'

// 前三名实心字，其余描边字
const FILLED_RANK_LIMIT = 3

const { hotTopicList, hotTopicLoading } = useHotTopics()
</script>

<template>
    <div class="hot-topic-panel">
        <div class="panel-head">
            <SectionTitle eyebrow="TRENDING" title="热门话题" size="md" />
            <span class="panel-hint">大家都在搜</span>
        </div>

        <div class="topic-grid">
            <!-- 加载中 -->
            <template v-if="hotTopicLoading">
                <span v-for="n in HOT_TOPIC_COUNT" :key="n" class="topic-skeleton" aria-hidden="true"></span>
            </template>

            <div v-else-if="hotTopicList.length === 0" class="topic-empty">
                <span class="empty-art" aria-hidden="true">#</span>
                <p class="empty-text">暂时还没有热门话题</p>
                <span class="empty-hint">去搜索框里搜点什么吧</span>
            </div>

            <!-- 点击在新标签页打开该热搜词的搜索结果 -->
            <template v-else>
                <a v-for="topic in hotTopicList" :key="topic.keyword" class="topic-card" :href="topic.href"
                    target="_blank" rel="noopener noreferrer" :title="topic.keyword"
                    :aria-label="`热门话题第 ${topic.rank} 名：${topic.keyword}`" :style="{ background: topic.background }">
                    <span class="topic-watermark" aria-hidden="true">{{ topic.rank }}</span>
                    <span class="topic-shade"></span>
                    <span class="topic-bottom">
                        <span class="topic-text">
                            <span class="topic-keyword">{{ topic.keyword }}</span>
                            <span
                                :class="['topic-rank', topic.rank <= FILLED_RANK_LIMIT ? 'rank-filled' : 'rank-outline']">
                                <span class="rank-hash">#</span><span class="rank-num">{{ topic.rank }}</span>
                            </span>
                        </span>
                        <span class="topic-arrow" aria-hidden="true">→</span>
                    </span>
                </a>
                <!-- 热搜词不足 6 个时，用虚线空位补齐两行，保持版面平衡 -->
                <span v-for="n in HOT_TOPIC_COUNT - hotTopicList.length" :key="`filler-${n}`" class="topic-filler"
                    aria-hidden="true"></span>
            </template>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.hot-topic-panel {
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-width: 0;
}

.panel-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
}

.panel-hint {
    flex-shrink: 0;
    font-size: 13px;
    color: $warm-ink-4;
}

.topic-grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-rows: repeat(2, minmax(160px, 1fr));
    gap: 12px;
}

/*——————话题卡片—————— */

.topic-card {
    position: relative;
    display: block;
    min-width: 0;
    border-radius: 18px;
    overflow: hidden;
    color: #FFFFFF;
    text-decoration: none;
    transition: transform 0.25s;

    &:hover {
        transform: translateY(-3px);

        .topic-arrow {
            transform: translateX(2px);
        }
    }

    &:focus-visible {
        outline: 2px solid $warm-ink;
        outline-offset: 3px;
    }
}

// 右上角超大号名次，衬托艺术字的氛围
.topic-watermark {
    position: absolute;
    right: 14px;
    top: 2px;
    font-family: $warm-font-sans;
    font-size: 88px;
    font-weight: 700;
    font-style: italic;
    line-height: 1;
    letter-spacing: -0.04em;
    color: rgba(255, 255, 255, 0.28);
    // 浅色底上淡白字几乎看不见，加一圈细描边勾出字形
    -webkit-text-stroke: 1px rgba(255, 255, 255, 0.6);
    pointer-events: none;
    user-select: none;
}

.topic-shade {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(26, 25, 22, 0) 35%, rgba(26, 25, 22, 0.62) 100%);
}

.topic-bottom {
    position: absolute;
    left: 20px;
    right: 20px;
    bottom: 18px;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
}

.topic-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
}

.topic-keyword {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 19px;
    font-weight: 600;
    color: #FFFFFF;
}

// 名次艺术字：等宽的 # + 斜体大号数字
.topic-rank {
    display: flex;
    align-items: baseline;
    gap: 2px;
    line-height: 1;
}

.rank-hash {
    font-family: $warm-font-mono;
    font-size: 15px;
    font-weight: 500;
    color: oklch(0.85 0.09 60);
}

.rank-num {
    font-family: $warm-font-sans;
    font-size: 30px;
    font-weight: 700;
    font-style: italic;
    line-height: 1;
    letter-spacing: -0.02em;
    // 斜体右侧留一点空间，避免描边被相邻元素压住
    padding-right: 0.08em;
}

.rank-filled .rank-num {
    color: #FFFFFF;
    text-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
}

.rank-outline .rank-num {
    color: transparent;
    -webkit-text-stroke: 1.2px rgba(255, 255, 255, 0.92);
}

.topic-arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    flex-shrink: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.22);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color: #FFFFFF;
    font-size: 14px;
    transition: transform 0.25s;
}

.topic-filler {
    border-radius: 18px;
    border: 1px dashed rgba(26, 25, 22, 0.1);
}

/*——————骨架—————— */

.topic-skeleton {
    border-radius: 18px;
    background: $warm-sunken;
}

@media (prefers-reduced-motion: no-preference) {
    .topic-skeleton {
        animation: skeleton-pulse 1.4s ease-in-out infinite;
    }
}

@keyframes skeleton-pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.55;
    }
}

/*——————空状态：占满整个网格—————— */

.topic-empty {
    grid-column: 1 / -1;
    grid-row: span 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 18px;
    background:
        repeating-linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0 1px, transparent 1px 9px),
        linear-gradient(140deg, oklch(0.96 0.008 80), oklch(0.91 0.014 75));
    box-shadow: inset 0 0 0 1px rgba(26, 25, 22, 0.04);
    text-align: center;
}

.empty-art {
    font-family: $warm-font-mono;
    font-size: 64px;
    font-weight: 500;
    line-height: 1;
    color: transparent;
    -webkit-text-stroke: 1.2px $warm-ink-5;
    margin-bottom: 6px;
}

.empty-text {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: $warm-ink-3;
}

.empty-hint {
    font-size: 13px;
    color: $warm-ink-4;
}
</style>
