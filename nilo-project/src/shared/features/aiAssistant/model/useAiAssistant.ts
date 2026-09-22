import { ref, toValue, watch, type MaybeRefOrGetter } from "vue";
import { AiAssistantApi } from "../api/AiAssistantApi";
import type { AiChatMessage } from "./AiChatMessage";

/** 与后端 @Size(max = 100) 保持一致 */
export const QUESTION_MAX_LENGTH = 100;

const WELCOME_TEXT =
  "你好，我是 Nilo 视频助手。想看什么告诉我，我帮你在站内找。";

/** 视频详情页里问的是当前这个视频 */
const VIDEO_WELCOME_TEXT =
  "你好，我是 Nilo 视频助手。关于这个视频想问什么？比如：某个内容在第几分钟讲的。";

/**
 * @param videoId 视频详情页传当前视频 id，提问时一起带给后端；首页不传
 */
export function useAiAssistant(videoId?: MaybeRefOrGetter<string | undefined>) {
  /* ————————状态———————— */

  /** 对话框是否展开 */
  const visible = ref(false);

  /** 当前对话的消息，只存在内存里，刷新页面就没了 */
  const messages = ref<AiChatMessage[]>([welcome(toValue(videoId))]);

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
    messages.value = [welcome(toValue(videoId))];
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
    const answer = await AiAssistantApi.ask(
      question,
      askedId,
      toValue(videoId),
    );
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
      segments: answer.segments,
    });
  }

  /* ————————监听———————— */

  // 换了视频就开新对话：后端按会话 id 在 Redis 里存多轮记忆，不换的话上一个视频的上下文会串过来
  watch(
    () => toValue(videoId),
    () => reset(),
  );

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

function welcome(videoId?: string): AiChatMessage {
  return {
    role: "assistant",
    content: videoId ? VIDEO_WELCOME_TEXT : WELCOME_TEXT,
  };
}

function createConversationId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  // 降级方案（非 HTTPS 环境没有 randomUUID）：只用字母、数字和短横线，后端会校验格式
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
