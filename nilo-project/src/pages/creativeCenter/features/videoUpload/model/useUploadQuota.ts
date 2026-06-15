import { computed, ref, type Ref } from "vue";
import { quotaApi } from "@/shared/api/QuotaApi";
import { useSystemConfigStore } from "@/shared/store/SystemConfigStore";
import type { PreuploadVideoFile } from "./PreuploadVideoFile";

const MEBIBYTE = 1024 * 1024;

export function useUploadQuota(
  preuploadList: Ref<PreuploadVideoFile[]>,
  coverBlob: Ref<Blob | null>,
) {
  const systemConfigStore = useSystemConfigStore();

  /**
   * Backend quota API returns the user's remaining quota in bytes.
   * The progress UI displays MiB and subtracts files selected in the current form.
   */
  const remainingVideoQuotaBytes = ref<number | null>(null);
  const remainingImageQuotaBytes = ref<number | null>(null);

  /**
   * Only the newly selected/cropped cover consumes image quota.
   * Existing covers loaded in edit mode are already stored on the server.
   */
  const coverQuotaCost = ref(0);

  /** New local video files consume quota; existing edit-mode files do not. */
  const usedVideoQuotaBytes = computed(() =>
    preuploadList.value
      .filter(item => !item.isExisting)
      .reduce((total, item) => total + item.fileSize, 0),
  );

  /** Image quota currently tracks the pending cover only. */
  const usedImageQuotaBytes = computed(() => coverQuotaCost.value);

  const shouldUploadCover = computed(
    () => coverBlob.value !== null && coverQuotaCost.value > 0,
  );

  const remainingVideoQuotaMiB = computed(() =>
    bytesToMiB(
      Math.max(
        0,
        (remainingVideoQuotaBytes.value ?? 0) - usedVideoQuotaBytes.value,
      ),
    ),
  );

  const remainingImageQuotaMiB = computed(() =>
    bytesToMiB(
      Math.max(
        0,
        (remainingImageQuotaBytes.value ?? 0) - usedImageQuotaBytes.value,
      ),
    ),
  );

  const videoQuotaPercent = computed(() =>
    calcRemainingQuotaPercent(
      remainingVideoQuotaMiB.value,
      systemConfigStore.dailyVideoUploadSize,
    ),
  );

  const imageQuotaPercent = computed(() =>
    calcRemainingQuotaPercent(
      remainingImageQuotaMiB.value,
      systemConfigStore.dailyImageUploadSize,
    ),
  );

  /** Load both remaining quotas once when the upload page opens. */
  async function loadUploadQuota() {
    const [videoQuota, imageQuota] = await Promise.all([
      quotaApi.getRemainingVideoUploadQuota(),
      quotaApi.getRemainingImageUploadQuota(),
    ]);

    remainingVideoQuotaBytes.value = videoQuota;
    remainingImageQuotaBytes.value = imageQuota;
  }

  function hasEnoughVideoQuota(file: File): boolean {
    if (remainingVideoQuotaBytes.value === null) return true;
    return (
      usedVideoQuotaBytes.value + file.size <= remainingVideoQuotaBytes.value
    );
  }

  function setCoverQuotaBytes(bytes: number) {
    coverQuotaCost.value = Math.max(0, bytes);
  }

  function bytesToMiB(bytes: number): number {
    return bytes / MEBIBYTE;
  }

  function formatMiB(value: number): string {
    return value.toFixed(2);
  }

  function calcRemainingQuotaPercent(
    remainingMiB: number,
    totalMiB: number,
  ): number {
    if (totalMiB <= 0) return 0;
    return Math.min(
      100,
      Math.max(0, Math.round((remainingMiB / totalMiB) * 100)),
    );
  }

  return {
    remainingVideoQuotaMiB,
    remainingImageQuotaMiB,
    videoQuotaPercent,
    imageQuotaPercent,
    usedVideoQuotaBytes,
    usedImageQuotaBytes,
    shouldUploadCover,
    loadUploadQuota,
    hasEnoughVideoQuota,
    setCoverQuotaBytes,
    formatMiB,
  };
}
