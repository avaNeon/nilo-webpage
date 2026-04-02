import { ServicePrefixMap, Api } from "@/shared/config/Api";
import useCategoryStore from "@/shared/store/CategoryStore";

export function useCategory() {
    
    const categoryStore = useCategoryStore();

    // 请求图标的完整url
    function getIcon(iconPath: string | undefined): string {
        if (!iconPath) {
            return ''
        }
        else {
            return `${import.meta.env.VITE_APP_BASE_URL}${ServicePrefixMap.web}${Api.sourcePath}${iconPath}`
        }
    }

    return {
        categoryStore,
        getIcon
    }
}
