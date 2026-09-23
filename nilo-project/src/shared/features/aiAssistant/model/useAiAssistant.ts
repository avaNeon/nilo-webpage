import { ref, toValue, watch, type MaybeRefOrGetter } from "vue";
import { AiAssistantApi, ASK_TIMEOUT } from "../api/AiAssistantApi";
import type { AiChatMessage } from "./AiChatMessage";

/** 与后端 @Size(max = 100) 保持一致 */
export const QUESTION_MAX_LENGTH = 100;

const WELCOME_TEXT =
  "你好，我是 Nilo 视频助手。想看什么告诉我，我帮你在站内找。";

/** 视频详情页里问的是当前这个视频 */
const VIDEO_WELCOME_TEXT =
  "你好，我是 Nilo 视频助手。关于这个视频想问什么？比如：总结一下这个视频，或者某个内容在第几分钟讲的。";

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

  /** 正在进行的流式请求，新对话或换视频时断开 */
  let askAbort: AbortController | null = null;

  /* ————————方法———————— */

  /** 展开 / 收起对话框（收起不清空，同一次浏览里还能接着聊） */
  function toggle() {
    visible.value = !visible.value;
  }

  /** 开始新对话：清空消息，换一个会话 id，进行中的回答不再写进来 */
  function reset() {
    conversationId = createConversationId();
    askAbort?.abort();
    askAbort = null;
    sending.value = false;
    messages.value = [welcome(toValue(videoId))];
    input.value = "";
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
    messages.value.push({
      role: "assistant",
      content: "",
      pending: "正在看你的问题",
    });
    const reply = messages.value[messages.value.length - 1]!;

    askAbort?.abort();
    const abort = new AbortController();
    askAbort = abort;
    const timer = window.setTimeout(() => abort.abort(), ASK_TIMEOUT);
    let finished = false;

    try {
      await AiAssistantApi.ask(
        question,
        askedId,
        toValue(videoId),
        {
          onStatus(text) {
            if (askedId !== conversationId) return;
            reply.pending = text;
          },
          onDelta(text) {
            if (askedId !== conversationId) return;
            reply.pending = undefined;
            reply.content += text;
          },
          onDone(done) {
            if (askedId !== conversationId) return;
            finished = true;
            reply.pending = undefined;
            reply.content = done.answer;
            reply.videos = done.videos;
            reply.segments = done.segments;
          },
          onError(text) {
            if (askedId !== conversationId) return;
            reply.pending = undefined;
            reply.content = text;
          },
        },
        abort.signal,
      );
      if (askedId === conversationId && !finished) {
        reply.pending = undefined;
        reply.content = reply.content || "出了点问题，请稍后再试。";
      }
    } catch (error) {
      // 新对话会先换会话 id 再断开，这里什么都不用写
      if (askedId !== conversationId) return;
      if (error instanceof DOMException && error.name === "AbortError") {
        reply.pending = undefined;
        reply.content = reply.content || "出了点问题，请稍后再试。";
        return;
      }
      reply.pending = undefined;
      reply.content = "出了点问题，请稍后再试。";
    } finally {
      window.clearTimeout(timer);
      if (askAbort === abort) {
        askAbort = null;
      }
      if (askedId === conversationId) {
        sending.value = false;
      }
    }
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
