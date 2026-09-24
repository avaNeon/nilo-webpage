import { VideoSearchApi } from '@/shared/api/VideoSearchApi'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

// 热门话题直接取搜索栏的热搜词，最多展示 6 个
export const HOT_TOPIC_COUNT = 6

// 每张话题卡片的底色色相，按位置依次取用
const TOPIC_HUES = [240, 40, 330, 160, 285, 85]

export interface HotTopic {
    keyword: string
    /** 名次，从 1 开始 */
    rank: number
    /** 搜索页地址，用于新标签页打开 */
    href: string
    background: string
}

/** 设计稿里的占位图：细斜纹 + 同色系渐变 */
function topicBackground(hue: number): string
{
    return 'repeating-linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0 1px, transparent 1px 9px), '
        + `linear-gradient(140deg, oklch(0.95 0.035 ${hue}), oklch(0.86 0.06 ${hue + 35}))`
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
