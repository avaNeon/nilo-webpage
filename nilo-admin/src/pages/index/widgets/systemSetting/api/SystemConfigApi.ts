import request from "@/shared/lib/request";
import { Api } from "@/shared/config/Api";
import type { SystemConfig } from "@/pages/index/widgets/systemSetting/model/SystemConfig";

/** 系统配置相关接口 */
export const SystemConfigApi = {
  /**
   * 获取系统配置
   * @returns 当前系统配置
   */
  async getSystemConfig(): Promise<SystemConfig | null> {
    const result = await request({
      method: "get",
      url: Api.systemConfig,
    });
    if (!result) return null;
    return result.data as SystemConfig;
  },

  /**
   * 修改系统配置
   * @param config 系统配置
   */
  async updateSystemConfig(config: SystemConfig) {
    return request({
      method: "put",
      url: Api.systemConfig,
      data: config as unknown as Record<string, unknown>,
    });
  },
} as const;
