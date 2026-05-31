export function useVideoUploadConfig() {
  // ==================== constants ====================

  /** Default chunk size: 5MB */
  const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024;
  const MAX_TAG_STRING_LENGTH = 300;
  const MAX_INTRODUCTION_LENGTH = 2000;

  return {
    DEFAULT_CHUNK_SIZE,
    MAX_TAG_STRING_LENGTH,
    MAX_INTRODUCTION_LENGTH,
  };
}
