import { useFileUpload } from "@/shared/composables/useFileUpload";
import { onUnmounted, ref, watch } from "vue";

const COVER_MAX_SIZE = 10 * 1024 * 1024;
const ACCEPT = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/bmp",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "image/avif",
  "image/tiff",
  "image/heic",
  "image/heif",
  "image/vnd.wap.wbmp",
  "image/x-xbitmap",
  "image/x-pixmap",
].join(", ");

export function useCoverUpload() {
  const editVisible = ref(false);
  const originalCoverUrl = ref("");
  const originalCoverBlob = ref<Blob | null>(null);
  const currentCoverUrl = ref("");
  const currentCoverBlob = ref<Blob | null>(null);

  const { uploadItems, selectFile } = useFileUpload({
    accept: ACCEPT,
    maxSize: COVER_MAX_SIZE,
    autoUpload: false,
  });

  // ==================== 内部方法 ====================

  /** 释放当前预览封面占用的 blob URL */
  function clearImgObj() {
    if (currentCoverUrl.value && currentCoverUrl.value.startsWith("blob:")) {
      URL.revokeObjectURL(currentCoverUrl.value);
    }
  }

  /** 释放原始图片（裁剪面板用）占用的 blob URL */
  function clearOriginalImgObj() {
    if (originalCoverUrl.value && originalCoverUrl.value.startsWith("blob:")) {
      URL.revokeObjectURL(originalCoverUrl.value);
    }
  }

  /**
   * 将图片自动裁剪为 16:9 居中，返回 Blob。
   * 保持原始图片的中心点不变，裁剪掉超出 16:9 比例的部分。
   */
  async function autoCropToCover(blob: Blob): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      img.onload = () => {
        URL.revokeObjectURL(url);

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;

        const imgW = img.naturalWidth;
        const imgH = img.naturalHeight;
        const targetRatio = 16 / 9;

        let cropW: number, cropH: number, sx: number, sy: number;

        if (imgW / imgH > targetRatio) {
          // 图片比 16:9 更宽 → 以高度为准，裁剪左右
          cropH = imgH;
          cropW = imgH * targetRatio;
          sx = (imgW - cropW) / 2;
          sy = 0;
        } else {
          // 图片比 16:9 更高（或相等）→ 以宽度为准，裁剪上下
          cropW = imgW;
          cropH = imgW / targetRatio;
          sx = 0;
          sy = (imgH - cropH) / 2;
        }

        canvas.width = cropW;
        canvas.height = cropH;
        ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, cropW, cropH);

        canvas.toBlob(
          result => {
            if (result) {
              resolve(result);
            } else {
              reject(new Error("Canvas toBlob returned null"));
            }
          },
          "image/jpeg",
          0.92,
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image for auto crop"));
      };
      img.src = url;
    });
  }

  // ==================== 公共方法 ====================

  /**
   * 裁剪确认后，用裁剪结果替换当前预览封面。
   * 注意：不影响 originalCoverBlob（原始图片），下次打开裁剪面板仍用原图。
   */
  function updateImgUrl(blob: Blob) {
    clearImgObj();
    currentCoverUrl.value = URL.createObjectURL(blob);
    currentCoverBlob.value = blob;
    editVisible.value = false;
  }

  /**
   * 打开裁剪弹窗。
   * 每次打开时从 originalCoverBlob（原始 File/Blob）重新生成一个独立的
   * blob URL 赋给 originalCoverUrl，确保裁剪面板始终拿到原始大图，
   * 且该 URL 与 currentCoverUrl（预览用）互不干扰。
   */
  function openCropper() {
    if (!currentCoverUrl.value) return;
    if (originalCoverBlob.value) {
      if (
        originalCoverUrl.value &&
        originalCoverUrl.value.startsWith("blob:")
      ) {
        URL.revokeObjectURL(originalCoverUrl.value);
      }
      originalCoverUrl.value = URL.createObjectURL(originalCoverBlob.value);
    }
    editVisible.value = true;
  }

  /**
   * 监听文件选择，始终只保留最新的一张封面（替换旧封面），
   * 并自动 16:9 居中裁剪后存入 currentCoverUrl/Blob，
   * 原始图片保留在 originalCoverUrl/Blob 供裁剪面板使用。
   */
  watch(
    () => uploadItems.value.length,
    async newLen => {
      if (newLen === 0) return;
      const latest = uploadItems.value[uploadItems.value.length - 1]!;

      clearOriginalImgObj();
      clearImgObj();

      originalCoverBlob.value = latest.file;
      originalCoverUrl.value = URL.createObjectURL(latest.file);

      try {
        const croppedBlob = await autoCropToCover(latest.file);
        currentCoverUrl.value = URL.createObjectURL(croppedBlob);
        currentCoverBlob.value = croppedBlob;
      } catch {
        currentCoverUrl.value = latest.localUrl;
        currentCoverBlob.value = latest.file;
      }

      uploadItems.value = [];
    },
  );

  onUnmounted(() => {
    clearImgObj();
    clearOriginalImgObj();
  });

  return {
    editVisible,
    originalCoverUrl,
    originalCoverBlob,
    currentCoverUrl,
    currentCoverBlob,
    selectFile,
    updateImgUrl,
    openCropper,
  };
}
