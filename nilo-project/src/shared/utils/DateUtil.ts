import dayjs, { Dayjs } from 'dayjs';

/**
 * Format date strings to relative time.
 * Logic:
 * - More than 1 year ago: X years ago (X年前)
 * - Less than 1 year but more than 1 month: X months ago (X个月前)
 * - Less than 1 month but more than 1 day: X days ago (X天前)
 * - Less than 1 day but more than 1 hour: X hours ago (X小时前)
 * - Less than 1 hour but more than 1 minute: X minutes ago (X分钟前)
 * - Less than 1 minute: Just now (刚刚)
 * 
 * @param date Date string returned by the backend (yyyy-MM-dd HH:mm:ss) or null
 * @returns Formatted string
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
 * Transforms a duration in seconds into a human-readable format. The highest display unit is hours.
 * @param duration Duration in seconds
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

