import { ServicePrefixMap, Api } from "@/shared/config/Api";
import useCategoryStore from "@/shared/store/CategoryStore";
import { useLoginStateStore } from "@/shared/store/LoginStateStore";

export function useCategory() {
    const loginStateStore = useLoginStateStore();
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
        loginStateStore,
        categoryStore,
        getIcon
    }
}
