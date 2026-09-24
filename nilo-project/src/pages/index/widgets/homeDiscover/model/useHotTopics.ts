import { VideoSearchApi } from '@/shared/api/VideoSearchApi'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

// 热门话题直接取搜索栏的热搜词，最多展示 8 个
export const HOT_TOPIC_COUNT = 8

// 每个话题圆标的渐变色相（起点、终点），按位置依次取用
const TOPIC_HUES: [number, number][] = [[70, 40], [150, 175], [350, 320], [95, 60], [200, 230], [30, 10], [300, 280], [120, 150]]

export interface HotTopic {
    keyword: string
    /** 名次，从 1 开始 */
    rank: number
    /** 搜索页地址，用于新标签页打开 */
    href: string
    background: string
}

/** 话题圆标：彩色渐变 + 偏右上一个白点 */
function topicBackground([from, to]: [number, number]): string
{
    return 'radial-gradient(circle at 68% 30%, #FFFFFF 0 4.5px, transparent 5.5px), '
        + `linear-gradient(145deg, oklch(0.84 0.13 ${from}), oklch(0.66 0.17 ${to}))`
}

export function useHotTopics()
{
    const router = useRouter()

    const hotTopicList = ref<HotTopic[]>([])
    const hotTopicLoading = ref(true)

    async function loadHotTopics()
    {
        hotTopicLoading.value = true
        try
        {
            const keywordList = await VideoSearchApi.getHotKeyword()
            // 去掉空白词和重复词
            const uniqueKeywordList = [...new Set(
                (keywordList ?? [])
                    .map(keyword => (typeof keyword === 'string' ? keyword.trim() : ''))
                    .filter(keyword => keyword !== ''),
            )]
            hotTopicList.value = uniqueKeywordList.slice(0, HOT_TOPIC_COUNT).map((keyword, index) => ({
                keyword,
                rank: index + 1,
                href: router.resolve({ name: 'video-search', params: { keyword } }).href,
                background: topicBackground(TOPIC_HUES[index % TOPIC_HUES.length]!),
            }))
        }
        finally
        {
            hotTopicLoading.value = false
        }
    }

    onMounted(() =>
    {
        void loadHotTopics()
    })

    return {
        hotTopicList,
        hotTopicLoading,
    }
}
