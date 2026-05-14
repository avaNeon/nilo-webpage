export const StringUtil = {
    isBlank(str: string): boolean {
        return /^\s*$/.test(str);
    },
    stripExtension(filename: string): string {
        const lastDot = filename.lastIndexOf(".");
        return lastDot > 0 ? filename.substring(0, lastDot) : filename;
    },
    getEscapedNewlineLength(text?: string): number {
        const raw = text ?? "";
        return raw.length + (raw.match(/\n/g)?.length ?? 0);
    },
    escapeNewline(text?: string): string {
        return (text ?? "").replace(/\n/g, "\\n");
    },
    unescapeNewline(text?: string | null): string {
        return (text ?? "").replace(/\\n/g, "\n");
    },
}
