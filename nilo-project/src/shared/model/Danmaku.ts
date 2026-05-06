import type { Danmu as ArtplayerDanmu } from "artplayer-plugin-danmuku"

export type DanmakuPosition = 0 | 1 | 2

export interface Danmaku {
    danmakuId?: string
    userId?: string
    videoId?: string
    fileIndex?: number
    content: string
    position: DanmakuPosition
    color: string
    displayMoment: number
    postTime?: string
}

export function toArtplayerDanmu(danmaku: Danmaku): ArtplayerDanmu {
    return {
        text: danmaku.content,
        mode: danmaku.position,
        color: danmaku.color,
        time: danmaku.displayMoment / 1000,
    }
}

export function fromArtplayerDanmu(
    danmu: ArtplayerDanmu,
    base: Partial<Pick<Danmaku, "danmakuId" | "userId" | "videoId" | "fileIndex">> = {},
): Danmaku {
    return {
        ...base,
        content: danmu.text,
        position: danmu.mode ?? 0,
        color: danmu.color ?? "#FFFFFF",
        displayMoment: Math.max(0, Math.round((danmu.time ?? 0) * 1000)),
    }
}