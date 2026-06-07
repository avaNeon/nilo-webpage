import type { BriefUserInfo } from "@/shared/model/BriefUserInfo";
import type { PublicUserInfo } from "./PublicUserInfo";

export interface VideoInfo {
    videoId: string | null;
    videoCover: string | null;
    videoName: string | null;
    briefUserInfo: BriefUserInfo | null; // 引用 BriefUserInfo.ts 中的定义
    userInfo: PublicUserInfo | null; // 引用 PublicUserInfo.ts 中的定义
    createTime: string | null;
    lastUpdateTime: string | null;
    pCategoryNumber: string | null;
    categoryNumber: string | null;
    postType: number | null;
    originInfo: string | null;
    tags: string[] | null;
    introduction: string | null;
    interaction: string | null;
    duration: number | null;
    playCount: number | null;
    likeCount: number | null;
    danmakuCount: number | null;
    commentCount: number | null;
    coinCount: number | null;
    collectCount: number | null;
    /** 0:转码中 1:转码失败 2:待审核 3:审核成功 4:审核失败 */
    status: 0 | 1 | 2 | 3 | 4 | null;
}