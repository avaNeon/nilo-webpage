export const StringUtil = {
    isBlank(str: string): boolean {
        return /^\s*$/.test(str);
    }
}