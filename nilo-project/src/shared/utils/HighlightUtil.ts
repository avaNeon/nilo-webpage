/**
 * 搜索结果标题：后端用 <span class="highlight"> 包住命中的关键词。
 * 只保留这一种标签，其余内容全部转义，可以放心交给 v-html。
 */
export function sanitizeHighlightHtml(value: string): string {
    return value
        .replace(/<span\s+class=(["'])highlight\1\s*>/gi, '[[[highlight-open]]]')
        .replace(/<\/span>/gi, '[[[highlight-close]]]')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/\[\[\[highlight-open\]\]\]/g, '<span class="highlight">')
        .replace(/\[\[\[highlight-close\]\]\]/g, '</span>');
}
