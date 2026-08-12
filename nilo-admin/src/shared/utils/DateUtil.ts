import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(utc);
dayjs.extend(customParseFormat);

/** 后端返回的墙钟时间格式（UTC+0，无时区后缀） */
const BACKEND_FORMAT = 'YYYY-MM-DD HH:mm:ss';

/** 绝对时间默认展示到分钟 */
const DISPLAY_FORMAT = 'YYYY-MM-DD HH:mm';

export type BackendDateInput = string | Date | null | undefined;

/**
 * 把后端 UTC 时间解析成访问者本地时区的 dayjs。
 * 兼容 "yyyy-MM-dd HH:mm:ss"；若已带 Z / 偏移则按 ISO 解析；Date 按绝对时刻转本地。
 */
export function parseBackendDateTime(value: BackendDateInput): Dayjs | null {
    if (value == null || value === '') {
        return null;
    }

    if (value instanceof Date) {
        const parsed = dayjs(value);
        return parsed.isValid() ? parsed : null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    // 已带时区信息（Z 或 ±HH:mm）时按 ISO 解析
    if (/[zZ]$/.test(trimmed) || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
        const parsed = dayjs(trimmed);
        return parsed.isValid() ? parsed : null;
    }

    const parsedUtc = dayjs.utc(trimmed, BACKEND_FORMAT, true);
    if (parsedUtc.isValid()) {
        return parsedUtc.local();
    }

    // 宽松兜底：仍按 UTC 墙钟解释
    const loose = dayjs.utc(trimmed);
    return loose.isValid() ? loose.local() : null;
}

/**
 * 后端 UTC → 本地绝对时间展示
 */
export function formatBackendDateTime(
    value: BackendDateInput,
    format: string = DISPLAY_FORMAT,
): string {
    const date = parseBackendDateTime(value);
    if (!date) {
        return '';
    }
    return date.format(format);
}

/**
 * 评论/弹幕等发布时间：1 分钟内显示「刚刚」，否则本地 YYYY-MM-DD HH:mm
 */
export function formatPostTime(value: BackendDateInput): string {
    const date = parseBackendDateTime(value);
    if (!date) {
        return '';
    }
    if (dayjs().diff(date, 'minute') < 1) {
        return '刚刚';
    }
    return date.format(DISPLAY_FORMAT);
}

/**
 * Format date strings to relative time（后端时间为 UTC）。
 */
export function calculateRelativeTime(date: BackendDateInput): string {
    if (!date) {
        return '未知日期';
    }

    const now: Dayjs = dayjs();
    const updateDate = parseBackendDateTime(date);

    if (!updateDate) {
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
 * Transforms a duration in seconds into a human-readable format.
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
