import Cookies from "js-cookie";
import { Api, resolveServicePrefix } from "@/shared/config/Api";
import type { AiCitedSegment, AiCitedVideo } from "../model/AiAnswer";

/** 和后端这条连接的 90 秒超时对齐 */
export const ASK_TIMEOUT = 90 * 1000;

export const AiAssistantApi = {
  /**
   * 流式提问。先收到进度，核对完时间点后再一段段收到正文，最后收到视频和片段
   */
  async ask(
    question: string,
    conversationId: string,
    videoId: string | undefined,
    handlers: AskStreamHandlers,
    signal: AbortSignal,
  ): Promise<void> {
    const body = new URLSearchParams({ question, conversationId });
    if (videoId) {
      body.set("videoId", videoId);
    }
    const prefix = `${import.meta.env.VITE_APP_BASE_URL}${resolveServicePrefix(Api.aiAsk)}`;
    const response = await fetch(prefix + Api.aiAsk, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        token: Cookies.get("token_normal") || "",
      },
      credentials: "include",
      body,
      signal,
    });
    if (!response.ok || !response.body) {
      handlers.onError("出了点问题，请稍后再试。");
      return;
    }
    await readSse(response.body, handlers);
  },
};

export interface AskStreamHandlers {
  onStatus: (text: string) => void;
  onDelta: (text: string) => void;
  onDone: (done: {
    answer: string;
    videos: AiCitedVideo[];
    segments: AiCitedSegment[];
  }) => void;
  onError: (text: string) => void;
}

/** 读 SSE：event 行 + data 行，空行结束一条 */
async function readSse(body: ReadableStream<Uint8Array>, handlers: AskStreamHandlers) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    let splitAt = buffer.indexOf("\n\n");
    while (splitAt >= 0) {
      dispatchFrame(buffer.slice(0, splitAt), handlers);
      buffer = buffer.slice(splitAt + 2);
      splitAt = buffer.indexOf("\n\n");
    }
  }
}

function dispatchFrame(raw: string, handlers: AskStreamHandlers) {
  let event = "message";
  const dataLines: string[] = [];
  for (const line of raw.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }
  if (dataLines.length === 0) {
    return;
  }
  const payload = JSON.parse(dataLines.join("\n")) as { text?: string } & AskStreamDone;
  if (event === "status" && payload.text) {
    handlers.onStatus(payload.text);
  } else if (event === "delta" && payload.text) {
    handlers.onDelta(payload.text);
  } else if (event === "done") {
    handlers.onDone({
      answer: payload.answer ?? "",
      videos: payload.videos ?? [],
      segments: payload.segments ?? [],
    });
  } else if (event === "error") {
    handlers.onError(payload.text || "出了点问题，请稍后再试。");
  }
}

interface AskStreamDone {
  answer?: string;
  videos?: AiCitedVideo[];
  segments?: AiCitedSegment[];
}
