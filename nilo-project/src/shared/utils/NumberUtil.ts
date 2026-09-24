const TEN_THOUSAND = 1e4;
const HUNDRED_MILLION = 1e8;

/** 保留一位小数并去掉末尾的 ".0" */
function toOneDecimal(value: number): string {
    return value.toFixed(1).replace(/\.0$/, '');
}

/**
 * 计数展示：不足 1 万用千分位（8,420），不足 1 亿用「万」（2.1万、42万），否则用「亿」
 */
export function formatCount(n: number | null | undefined): string {
    if (n == null || !Number.isFinite(n)) {
        return '0';
    }

    const value = Math.round(n);
    const sign = value < 0 ? '-' : '';
    const abs = Math.abs(value);

    if (abs < TEN_THOUSAND) {
        return sign + abs.toLocaleString('en-US');
    }

    // 9999.95万 四舍五入后会变成 10000万，此时直接进位到「亿」
    if (abs < HUNDRED_MILLION && Number((abs / TEN_THOUSAND).toFixed(1)) < TEN_THOUSAND) {
        return `${sign}${toOneDecimal(abs / TEN_THOUSAND)}万`;
    }

    return `${sign}${toOneDecimal(abs / HUNDRED_MILLION)}亿`;
}
