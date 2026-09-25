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

/**
 * 时长（秒）→ 播放器式时钟：不足 1 小时 "MM:SS"（如 01:05），否则 "H:MM:SS"
 */
export function formatDurationClock(sec: number | null | undefined): string {
    if (sec == null || !Number.isFinite(sec) || sec < 0) {
        return '00:00';
    }
    const total = Math.floor(sec);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = (total % 60).toString().padStart(2, '0');

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds}`;
}

/**
 * 是否为访问者本地时区的今天
 */
export function isToday(value: BackendDateInput): boolean {
    const date = parseBackendDateTime(value);
    return date != null && date.isSame(dayjs(), 'day');
}

/**
 * 按自然日计算的相对日期：今天 / N 天前 / N 周前 / N 个月前 / N 年前；无效日期返回空串
 */
export function formatRelativeDay(value: BackendDateInput): string {
    const date = parseBackendDateTime(value);
    if (!date) {
        return '';
    }

    const days = dayjs().startOf('day').diff(date.startOf('day'), 'day');
    // 同一天或服务器时间略超前时都视为今天
    if (days <= 0) {
        return '今天';
    }
    if (days < 7) {
        return `${days} 天前`;
    }
    if (days < 30) {
        return `${Math.floor(days / 7)} 周前`;
    }
    if (days < 365) {
        return `${Math.floor(days / 30)} 个月前`;
    }
    return `${Math.floor(days / 365)} 年前`;
}
