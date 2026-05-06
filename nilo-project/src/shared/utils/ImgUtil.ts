import { ServicePrefixMap, Api } from "@/shared/config/Api";

// 获取图片的完整url
function imgRequestUrl(path: string | null, tmp?: boolean): string {
    if (!path) {
        return '';
    }
    if (tmp) {
        return `${import.meta.env.VITE_APP_BASE_URL}${ServicePrefixMap.web}${Api.tmpSourcePath}${path}`
    }
    else {
        return `${import.meta.env.VITE_APP_BASE_URL}${ServicePrefixMap.web}${Api.sourcePath}${path}`
    }
}

export {
    imgRequestUrl
}
