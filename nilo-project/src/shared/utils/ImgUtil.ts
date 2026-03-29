import { ServicePrefixMap, Api } from "@/shared/config/Api";

// 获取图片的完整url
function imgRequestUrl(path: string | null): string {
    if (path === null) {
        return '';
    }
    return `${import.meta.env.VITE_APP_BASE_URL}${ServicePrefixMap.web}${Api.sourcePath}${path}`
}

export {
    imgRequestUrl
}
