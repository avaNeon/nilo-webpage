export function useVideoUploadConfig() {
  const MAX_TAG_STRING_LENGTH = 300;
  const MAX_INTRODUCTION_LENGTH = 2000;
  const MAX_TITLE_LENGTH = 100;
  /** 分P标题 */
  const MAX_PART_NAME_LENGTH = 80;

  return {
    MAX_TAG_STRING_LENGTH,
    MAX_INTRODUCTION_LENGTH,
    MAX_TITLE_LENGTH,
    MAX_PART_NAME_LENGTH,
  };
}
