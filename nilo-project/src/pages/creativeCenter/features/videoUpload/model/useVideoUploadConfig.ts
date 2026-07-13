export function useVideoUploadConfig() {
  const MAX_TAG_STRING_LENGTH = 300;
  const MAX_INTRODUCTION_LENGTH = 2000;

  return {
    MAX_TAG_STRING_LENGTH,
    MAX_INTRODUCTION_LENGTH,
  };
}
