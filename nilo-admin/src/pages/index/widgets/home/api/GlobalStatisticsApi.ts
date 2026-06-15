import request from "@/shared/lib/request";
import { Api } from "@/shared/config/Api";
import type { StatisticsInfo } from "@/pages/index/widgets/home/model/StatisticsInfo";
import type { UserStat } from "@/pages/index/widgets/home/model/UserStat";

export const GlobalStatisticsApi = {
    /**
     * 获取指定时间内的注册用户数据
     * @param start 开始日期（ISO 格式，如 "2024-01-01"）
     * @param end 结束日期（ISO 格式，如 "2024-12-31"）
     */
    async getUserStatByDatePeriod(
        start: string,
        end: string,
    ): Promise<UserStat[] | null> {
        const result = await request({
            method: "get",
            url: Api.userStat,
            params: { start, end },
        });
        if (!result) return null;
        return result.data as UserStat[];
    },

    /**
     * 获取近期统计数据
     */
    async loadRecentStatisticsInfo(): Promise<StatisticsInfo[] | null> {
        const result = await request({
            method: "get",
            url: Api.recentStatistics,
        });
        if (!result) return null;
        return result.data as StatisticsInfo[];
    },
};
