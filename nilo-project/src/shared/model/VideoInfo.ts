import type { BriefUserInfo } from "@/shared/model/BriefUserInfo";

export interface VideoInfo {
    videoId: string | null;
    videoCover: string | null;
    videoName: string | null;
    briefUserInfo: BriefUserInfo | null; // 引用 UserInfo.ts 中的定义
    createTime: string | null;
    lastUpdateTime: string | null;
    pCategoryId: number | null;
    categoryId: number | null;
    postType: number | null;
    originInfo: string | null;
    tags: string | null;
    introduction: string | null;
    interaction: string | null;
    duration: number | null;
    playCount: number | null;
    likeCount: number | null;
    danmakuCount: number | null;
    commentCount: number | null;
    coinCount: number | null;
    collectCount: number | null;
}