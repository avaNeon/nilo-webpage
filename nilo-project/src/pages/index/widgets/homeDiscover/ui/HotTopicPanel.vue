<script setup lang="ts">
import { inject } from 'vue'
import { HOT_TOPIC_COUNT, useHotTopics } from '../model/useHotTopics'

const mainContentMaxWidth: number = inject('mainContentMaxWidth', 0)
const mainContentMinWidth: number = inject('mainContentMinWidth', 0)

const { hotTopicList, hotTopicLoading } = useHotTopics()
</script>

<template>
    <!-- 通栏蓝色色块：左侧标题，右侧话题胶囊 -->
    <section class="hot-topic-band" aria-label="热门话题">
        <div class="band-inner" :style="{
            'max-width': mainContentMaxWidth + 'px',
            'min-width': mainContentMinWidth + 'px',
        }">
            <div class="band-intro">
                <h2 class="band-title">热门话题</h2>
                <p class="band-desc">大家最近都在搜这些，点一下直接看搜索结果。</p>
            </div>

            <div class="topic-list">
                <!-- 加载中 -->
                <template v-if="hotTopicLoading">
                    <span v-for="n in HOT_TOPIC_COUNT" :key="n" class="topic-skeleton" aria-hidden="true"></span>
                </template>

                <p v-else-if="hotTopicList.length === 0" class="topic-empty">暂时还没有热门话题，去搜索框里搜点什么吧</p>

                <!-- 点击在新标签页打开该热搜词的搜索结果 -->
                <template v-else>
                    <a v-for="topic in hotTopicList" :key="topic.keyword" class="topic-pill" :href="topic.href"
                        target="_blank" rel="noopener noreferrer" :title="topic.keyword"
                        :aria-label="`热门话题第 ${topic.rank} 名：${topic.keyword}`">
                        <span class="topic-mark" :style="{ background: topic.background }"></span>
                        <span class="topic-keyword">#{{ topic.keyword }}</span>
                        <span class="topic-rank">TOP {{ topic.rank }}</span>
                    </a>
                </template>
            </div>
        </div>
    </section>
</template>

<style lang="scss" scoped>
.hot-topic-band {
    width: 100%;
    margin-top: 104px;
    background: $warm-accent;
    color: #FFFFFF;
}

.band-inner {
    display: grid;
    grid-template-columns: minmax(0, 4fr) minmax(0, 8fr);
    gap: 48px;
    margin: 0 auto;
    padding: 72px 48px 80px;
}

.band-intro {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.band-title {
    margin: 0;
    font-size: 40px;
    font-weight: 800;
    letter-spacing: -0.02em;
}

.band-desc {
    max-width: 320px;
    margin: 0;
    font-size: 15px;
    line-height: 1.8;
    color: $warm-accent-on-dark-2;
}

.topic-list {
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    gap: 14px;
}

.topic-pill {
    display: flex;
    align-items: center;
    gap: 14px;
    max-width: 100%;
    height: 72px;
    padding: 0 26px 0 10px;
    border-radius: 999px;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.4);
    color: #FFFFFF;
    text-decoration: none;
    transition: background 0.2s;

    &:hover {
        background: rgba(255, 255, 255, 0.12);
    }

    &:focus-visible {
        outline: 2px solid #FFFFFF;
        outline-offset: 3px;
    }
}

.topic-mark {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    flex-shrink: 0;
}

.topic-keyword {
    min-width: 0;
    max-width: 280px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.01em;
}

.topic-rank {
    flex-shrink: 0;
    font-family: $warm-font-mono;
    font-size: 12px;
    letter-spacing: 0.06em;
    color: $warm-accent-on-dark;
}

/*——————骨架 / 空状态—————— */

.topic-skeleton {
    width: 200px;
    height: 72px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.12);
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

.topic-empty {
    margin: 0;
    padding-top: 12px;
    font-size: 15px;
    color: $warm-accent-on-dark-2;
}
</style>
