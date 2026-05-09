import { Api } from "../config/Api";
import request from "../lib/request";
import type { SystemConfig } from "../model/SystemConfig";

export const SystemApi = {
  async getSystemConfig(): Promise<SystemConfig | null> {
    const result = await request({
      method: "get",
      url: Api.systemConfig,
    });
    if (result) {
      return result.data;
    } else {
      return null;
    }
  },
};
