import { ref } from "vue";
import { AiAssistantApi } from "../api/AiAssistantApi";
import type { AiChatMessage } from "./AiChatMessage";

/** 与后端 @Size(max = 100) 保持一致 */
export const QUESTION_MAX_LENGTH = 100;

const WELCOME_TEXT =
  "你好，我是 Nilo 视频助手。想看什么告诉我，我帮你在站内找。";

export function useAiAssistant() {
  /* ————————状态———————— */

  /** 对话框是否展开 */
  const visible = ref(false);

  /** 当前对话的消息，只存在内存里，刷新页面就没了 */
  const messages = ref<AiChatMessage[]>([welcome()]);

  /** 输入框内容 */
  const input = ref("");

  /** 是否正在等待回答 */
  const sending = ref(false);

  /** 会话 id，后端靠它把多轮对话串起来；开始新对话时重新生成 */
  let conversationId = createConversationId();

  /* ————————方法———————— */

  /** 展开 / 收起对话框（收起不清空，同一次浏览里还能接着聊） */
  function toggle() {
    visible.value = !visible.value;
  }

  /** 开始新对话：清空消息，换一个会话 id */
  function reset() {
    messages.value = [welcome()];
    input.value = "";
    conversationId = createConversationId();
  }

  /** 发送输入框里的问题 */
  async function send() {
    const question = input.value.trim();
    if (!question || sending.value) {
      return;
    }
    messages.value.push({ role: "user", content: question });
    input.value = "";
    sending.value = true;

    const askedId = conversationId;
    const answer = await AiAssistantApi.ask(question, askedId);
    sending.value = false;

    // 等待期间点了「新对话」，这条回答属于旧对话，丢掉
    if (askedId !== conversationId) {
      return;
    }
    if (!answer) {
      messages.value.push({
        role: "assistant",
        content: "出了点问题，请稍后再试。",
      });
      return;
    }
    messages.value.push({
      role: "assistant",
      content: answer.answer,
      videos: answer.videos,
    });
  }

  return {
    visible,
    messages,
    input,
    sending,
    toggle,
    reset,
    send,
  };
}

function welcome(): AiChatMessage {
  return { role: "assistant", content: WELCOME_TEXT };
}

function createConversationId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  // 降级方案（非 HTTPS 环境没有 randomUUID）：只用字母、数字和短横线，后端会校验格式
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
