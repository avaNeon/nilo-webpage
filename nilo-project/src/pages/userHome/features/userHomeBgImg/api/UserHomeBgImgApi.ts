import request from "@/shared/lib/request";
import { Api } from "@/shared/config/Api";

export const UserHomeBgImgApi = {
  /**
   * 修改个人主页主题
   * @param themeIndex 主题编号（1 ~ N）
   * @returns 是否保存成功
   */
  async saveTheme(themeIndex: number): Promise<boolean> {
    const result = await request({
      method: "post",
      url: Api.uHomeSaveTheme + themeIndex,
    });

    return result?.code === 200;
  },
};
