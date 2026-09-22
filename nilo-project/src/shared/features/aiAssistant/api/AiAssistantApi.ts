import request from "@/shared/lib/request";
import { Api } from "@/shared/config/Api";
import type { AiAnswer } from "../model/AiAnswer";

/** 一次回答要先分类、再调工具、再生成，经常超过默认的 10 秒 */
const ASK_TIMEOUT = 60 * 1000;

export const AiAssistantApi = {
  /**
   * 向 AI 助手提问
   * @param question 问题
   * @param conversationId 会话 id，同一个 id 就是同一段对话
   * @param videoId 在视频详情页提问时带上当前视频 id，首页不传
   * @returns 回答；失败返回 null（不弹全局错误提示，由对话框自己显示）
   */
  async ask(
    question: string,
    conversationId: string,
    videoId?: string,
  ): Promise<AiAnswer | null> {
    const data: Record<string, string> = { question, conversationId };
    // 没有 videoId 时不能放这个 key：form 序列化会把 undefined 变成空串
    if (videoId) {
      data.videoId = videoId;
    }
    const result = await request({
      method: "post",
      url: Api.aiAsk,
      data,
      dataType: "form",
      showError: false,
      timeout: ASK_TIMEOUT,
    });
    if (!result?.data) {
      return null;
    }
    return result.data;
  },
};
