import dayjs, { Dayjs } from 'dayjs';

/**
 * 格式化视频发布/更新时间
 * 逻辑：
 * - 超过1年显示：X年前
 * - 不到1年但超过1个月：X个月前
 * - 1个月之内但超过1天：X天前
 * - 1天之内但超过1小时：X小时前
 * - 1小时之内但超过1分钟：X分钟前
 * - 小于1分钟：刚刚
 * 
 * @param date 后端返回的时间字符串 (yyyy-MM-dd HH:mm:ss) 或 null
 * @returns 格式化后的字符串
 */
export function calculateRelativeTime(date: string | null | undefined): string {
    if (!date) {
        return '未知日期';
    }

    const now: Dayjs = dayjs();
    const updateDate: Dayjs = dayjs(date);

    // 检查日期是否有效
    if (!updateDate.isValid()) {
        return '无效日期';
    }

    const diffYears = now.diff(updateDate, 'year');
    if (diffYears > 0) {
        return `${diffYears}年前`;
    }

    const diffMonths = now.diff(updateDate, 'month');
    if (diffMonths > 0) {
        return `${diffMonths}个月前`;
    }

    const diffDays = now.diff(updateDate, 'day');
    if (diffDays > 0) {
        return `${diffDays}天前`;
    }

    const diffHours = now.diff(updateDate, 'hour');
    if (diffHours > 0) {
        return `${diffHours}小时前`;
    }

    const diffMinutes = now.diff(updateDate, 'minute');
    if (diffMinutes > 0) {
        return `${diffMinutes}分钟前`;
    }

    return '刚刚';
}

/**
 * 将视频时长（单位：秒）转换为最大单位为小时的字符串格式
 * @param duration 时间（单位：秒）
 */
export function calculateDuration(duration: number | null): string {
    if (duration === null) {
        return '0:00';
    }
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}
