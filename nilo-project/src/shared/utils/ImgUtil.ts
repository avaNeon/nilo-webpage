import { WEB_SERVICE_PREFIX, Api } from "@/shared/config/Api";

// 获取图片的完整url
function imgRequestUrl(path: string | null, tmp?: boolean): string {
    if (!path) {
        return '';
    }
    if (tmp) {
        return `${import.meta.env.VITE_APP_BASE_URL}${WEB_SERVICE_PREFIX}${Api.tmpSourcePath}${path}`
    }
    else {
        return `${import.meta.env.VITE_APP_BASE_URL}${WEB_SERVICE_PREFIX}${Api.sourcePath}${path}`
    }
}

export {
    imgRequestUrl
}
