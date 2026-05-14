import { Api } from "@/shared/config/Api";
import request from "@/shared/lib/request";
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import useVideoStateStore from "../store/VideoStateStore";
import { VideoCommentApi } from "../api/VideoCommentApi";
import type { VideoComment } from "@/shared/model/VideoComment";
import { useLoginStateStore } from "@/shared/store/LoginStateStore";
import { UserApi } from "@/shared/api/userApi";
import type { TokenUserInfo } from "@/shared/model/TokenUserInfo";

// 交互类型常量
export const InteractionType = {
    NO_PROHIBITION: -1,
    NO_DANMAKU: 0,
    NO_COMMENT: 1,
} as const

export function useVideoDetail() {
    const videoStateStore = useVideoStateStore()
    const loginStateStore = useLoginStateStore()
    const route = useRoute()
    const avatarUrl = ref<string>('')

    // 关注相关状态
    const haveFollowed = ref(false)
    const followerCount = ref(0)

    // 分页相关
    const currentPage = ref(1)
    const PAGE_SIZE = 10
    const currentSortType = ref('popular')

    async function loadVideoInfo(videoId: string) {
        const result = await request({
            method: 'get',
            url: Api.loadVideoInfo + `/${videoId}`,
        })
        if (!result) {
            return
        }
        videoStateStore.setVideoInfo(result.data)
        avatarUrl.value = videoStateStore.videoInfo.userInfo?.avatar ? videoStateStore.videoInfo.userInfo.avatar : ''
    }

    async function loadComments(parentCommentId: string, pageNo: number, orderType: string, depth?: number): Promise<VideoComment[]> {
        if (videoStateStore.videoInfo.videoId) {
            return await VideoCommentApi.getCommentList(videoStateStore.videoInfo.videoId, parentCommentId, pageNo, orderType, depth)
        }
        else {
            return []
        }
    }

    const comments = ref<VideoComment[]>([])

    /** 追踪每个父评论的下一个分页页码（parentCommentId → nextPageNo） */
    const nextPageMap = new Map<string, number>()

    /**
     * 递归在评论树中查找指定 commentId 的节点
     */
    function findCommentById(list: VideoComment[], targetId: string): VideoComment | null {
        for (const item of list) {
            if (item.commentId === targetId) {
                return item
            }
            if (item.childCommentList && item.childCommentList.length > 0) {
                const found = findCommentById(item.childCommentList, targetId)
                if (found) {
                    return found
                }
            }
        }
        return null
    }

    /**
     * 加载某条评论的更多子评论，并追加到其 childCommentList 中
     */
    async function loadMoreChildren(parentCommentId: string) {
        const parent = findCommentById(comments.value, parentCommentId)
        if (!parent) {
            return
        }

        // 获取下一个页码（首次加载子评论时从第2页开始，因为第1页已随父评论一起返回）
        const currentPage = nextPageMap.get(parentCommentId) ?? 2
        nextPageMap.set(parentCommentId, currentPage + 1)

        const newChildren = await loadComments(parentCommentId, currentPage, 'earliest', 1)
        if (!newChildren || newChildren.length === 0) {
            parent.hasMoreChildren = false
            return
        }

        // 追加到子评论列表
        if (!parent.childCommentList) {
            parent.childCommentList = []
        }
        parent.childCommentList.push(...newChildren)

        // 服务端返回的 hasMoreChildren 以最后一条为准
        const lastChild = newChildren[newChildren.length - 1]
        parent.hasMoreChildren = lastChild?.hasMoreChildren ?? false
    }

    const firstLevelCommentCount = ref<number>(0)

    async function loadFirstLevelCommentCount(videoId: string) {
        firstLevelCommentCount.value = await VideoCommentApi.getFirstLevelCommentCount(videoId)
    }

    // 关注功能
    function subscribe() {
        if (haveFollowed.value || !loginStateStore.loginState) {
            loginStateStore.showPanel = true
            return
        }
        //TODO Let's do it later
        // const result = request({
        //     method: 'get',
        //     url: Api.follow,
        //     params: {
        //         userId: videoInfo.value?.userInfo?.userId
        //     }
        // })
        // if (!result) {
        //     return
        // }
        followerCount.value++
        haveFollowed.value = true
    }

    // 取消关注功能
    function unsubscribe() {
        // it won't happen in normal case
        if (!haveFollowed.value || !loginStateStore.loginState) {
            return
        }
        //TODO Let's do it later
        // const result = request({
        //     method: 'get',
        //     url: Api.cancelFollow,
        //     params: {
        //         userId: videoInfo.value?.userInfo?.userId
        //     }
        // })
        // if (!result) {
        //     return
        // }
        followerCount.value--
        haveFollowed.value = false
    }

    // 投币后操作
    async function afterCoinAction() {
        const tokenUserInfo: TokenUserInfo | null = await UserApi.autoLogin()
        if (tokenUserInfo) {
            loginStateStore.setCurrentCoin(tokenUserInfo.currentCoin)
        }
        loadVideoInfo(route.params.videoId as string)
    }

    // 分页变化处理
    async function pageChange(page: number) {
        if (route.params.videoId) {
            comments.value = await loadComments('0', page, currentSortType.value)
        }
        // 回到评论区锚点
        const el = document.getElementById("video-comment-section");
        if (el) {
            el.scrollIntoView(true);
        }
    }

    // 按排序类型加载评论
    async function loadCommentsBySortType(sortType: string) {
        comments.value = await loadComments('0', currentPage.value, sortType)
        currentSortType.value = sortType
    }

    // 获取交互设置
    function getInteraction(): number[] {
        if (!videoStateStore.videoInfo.interaction) {
            return [InteractionType.NO_PROHIBITION]
        }
        const arr = videoStateStore.videoInfo.interaction.split(',')
        return arr.map((str) => Number.parseInt(str))
    }

    // 检查评论是否可用
    function isCommentAvailable(): boolean {
        return !getInteraction().includes(InteractionType.NO_COMMENT)
    }

    // 检查弹幕是否可用
    function isDanmakuAvailable(): boolean {
        return !getInteraction().includes(InteractionType.NO_DANMAKU)
    }

    // 初始化加载
    function initLoad() {
        if (route.params.videoId) {
            loadVideoInfo(route.params.videoId as string)
        }
    }

    watch(() => videoStateStore.videoInfo.videoId, async () => {
        comments.value = await loadComments('0', 1, 'popular')
        if (videoStateStore.videoInfo.videoId) {
            await loadFirstLevelCommentCount(videoStateStore.videoInfo.videoId)
        }
    })

    return {
        // 状态
        avatarUrl,
        comments,
        firstLevelCommentCount,
        haveFollowed,
        followerCount,
        currentPage,
        PAGE_SIZE,
        currentSortType,
        // 方法
        loadVideoInfo,
        loadMoreChildren,
        loadComments,
        loadCommentsBySortType,
        subscribe,
        unsubscribe,
        afterCoinAction,
        pageChange,
        getInteraction,
        isCommentAvailable,
        isDanmakuAvailable,
        initLoad,
        // 常量
        InteractionType,
    }
}
