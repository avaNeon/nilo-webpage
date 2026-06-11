import message from "@/shared/lib/message";
import { useSystemConfigStore } from "@/shared/store/SystemConfigStore";
import { FileUtil } from "@/shared/utils/FileUtil";

export function useFileValidation() {
  // ==================== stores ====================
  
  const systemConfigStore = useSystemConfigStore();

  // ==================== validation ====================

  /**
   * Validate a video file against system config limits.
   * Returns true if the file passes all checks, false otherwise
   * (an error message will already have been shown to the user).
   */
  async function validateVideoFile(file: File): Promise<boolean> {
    // 1. Empty file check
    if (!file || file.size === 0) {
      message.error(`"${file.name}" 文件为空，无法上传`);
      return false;
    }

    // 2. File size limit (config is in MB)
    const maxSizeBytes = systemConfigStore.videoFileMaxSize * 1024 * 1024;
    if (systemConfigStore.videoFileMaxSize > 0 && file.size > maxSizeBytes) {
      message.error(
        `"${file.name}" 文件过大（${FileUtil.formatMB(file.size)}MB），` +
          `最大允许 ${systemConfigStore.videoFileMaxSize}MB`,
      );
      return false;
    }

    return true;
  }

  return { validateVideoFile };
}
