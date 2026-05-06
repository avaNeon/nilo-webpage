import { SystemApi } from '@/shared/api/SystemApi'
import { useSystemConfigStore } from '@/shared/store/SystemConfigStore'

/**
 * 初始化系统配置信息
 * @returns 加载系统配置函数
 */
export function useInitSystemConfig() {
    const systemStore = useSystemConfigStore()

    async function loadSystemConfig() {
        const config = await SystemApi.getSystemConfig()
        if (!config) {
            return
        }
        systemStore.setSystemConfig(config)
    }

    return { loadSystemConfig }
}
