/**
 * 获取或创建视频在线会话ID（sessionId）。
 * 与心跳模块共用同一个 sessionId，带1天过期时间。
 *
 * - 优先从 localStorage 读取已有 sessionId，校验过期时间和 UUID 格式
 * - 若不存在、已过期或格式无效，则创建新的 sessionId 并持久化
 * - 内存缓存避免重复读取 localStorage
 */

const STORAGE_KEY = "video-online-session-id";

// 1天 = 86400000 毫秒
const EXPIRE_DURATION = 24 * 60 * 60 * 1000;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface SessionData {
  sessionId: string;
  expiresAt: number; // timestamp in ms
}

let memoryCache: string | null = null;

function createSessionId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  // 降级方案：timestamp + 随机数
  return `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
}

function readFromStorage(): SessionData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const data: SessionData = JSON.parse(raw);
    if (
      data &&
      typeof data.sessionId === "string" &&
      UUID_PATTERN.test(data.sessionId) &&
      typeof data.expiresAt === "number"
    ) {
      return data;
    }
  } catch {
    // 解析失败或 localStorage 不可用
  }
  return null;
}

function writeToStorage(sessionId: string): void {
  const data: SessionData = {
    sessionId,
    expiresAt: Date.now() + EXPIRE_DURATION,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage 不可写时忽略
  }
}

/**
 * 获取或创建视频在线会话ID。
 * 若 localStorage 中已有未过期的合法 sessionId，直接返回；
 * 否则创建新的 sessionId，写入 localStorage 并设置1天过期时间。
 */
export function getOrCreateSessionId(): string {
  // 优先返回内存缓存
  if (memoryCache) {
    return memoryCache;
  }

  const stored = readFromStorage();
  if (stored && stored.expiresAt > Date.now()) {
    memoryCache = stored.sessionId;
    return stored.sessionId;
  }

  // 创建新 sessionId
  const newSessionId = createSessionId();
  writeToStorage(newSessionId);
  memoryCache = newSessionId;
  return newSessionId;
}
