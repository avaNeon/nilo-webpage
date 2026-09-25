import { computed, ref, type Ref } from "vue";
import { quotaApi } from "@/shared/api/QuotaApi";
import { useSystemConfigStore } from "@/shared/store/SystemConfigStore";
import type { PreuploadVideoFile } from "./PreuploadVideoFile";

const MEBIBYTE = 1024 * 1024;

/** 额度条：今日已用 + 本次投稿待占用 */
export interface QuotaUsage {
  /** 今日已用（MiB）；额度还没拿到时为 null */
  usedMiB: number | null;
  /** 今日还剩（MiB）；额度还没拿到时为 null */
  remainingMiB: number | null;
  /** 本次投稿还要占用的（MiB） */
  pendingMiB: number;
  /** 每日上限（MiB，系统配置） */
  limitMiB: number;
  /** 本次投稿超出今日剩余额度 */
  over: boolean;
}

export function useUploadQuota(
  preuploadList: Ref<PreuploadVideoFile[]>,
  coverBlob: Ref<Blob | null>,
  submitted: Ref<boolean>,
) {
  const systemConfigStore = useSystemConfigStore();

  /**
   * 后端只返回今日剩余额度（字节）；每日上限取系统配置，已用 = 上限 - 剩余。
   */
  const remainingVideoQuotaBytes = ref<number | null>(null);
  const remainingImageQuotaBytes = ref<number | null>(null);

  /** 首次加载额度中 */
  const quotaLoading = ref(true);

  /**
   * Only the newly selected/cropped cover consumes image quota.
   * Existing covers loaded in edit mode are already stored on the server.
   */
  const coverQuotaCost = ref(0);

  /** New local video files consume quota; existing edit-mode files do not. */
  const newVideoFiles = computed(() =>
    preuploadList.value.filter(item => !item.isExisting),
  );

  const usedVideoQuotaBytes = computed(() =>
    newVideoFiles.value.reduce((total, item) => total + item.fileSize, 0),
  );

  /** 本次已经传上去的字节 */
  const sentVideoBytes = computed(() =>
    newVideoFiles.value.reduce(
      (total, item) => total + Math.min(item.uploadedBytes, item.fileSize),
      0,
    ),
  );

  const shouldUploadCover = computed(
    () => coverBlob.value !== null && coverQuotaCost.value > 0,
  );

  function exceeds(remainingBytes: number | null, bytes: number): boolean {
    return remainingBytes !== null && bytes > remainingBytes;
  }

  function buildUsage(
    remainingBytes: number | null,
    limitMB: number,
    sentBytes: number,
    pendingBytes: number,
    over: boolean,
  ): QuotaUsage {
    const limitMiB = Math.max(0, limitMB);
    const pendingMiB = pendingBytes / MEBIBYTE;
    if (remainingBytes === null) {
      return { usedMiB: null, remainingMiB: null, pendingMiB, limitMiB, over };
    }
    const usedMiB =
      Math.max(0, limitMiB - remainingBytes / MEBIBYTE) + sentBytes / MEBIBYTE;
    const remainingMiB = Math.max(0, remainingBytes - sentBytes) / MEBIBYTE;
    return { usedMiB, remainingMiB, pendingMiB, limitMiB, over };
  }

  /** 上传中已传的部分算进「已用」；投稿成功后本次文件已记进剩余额度，不再重复算 */
  const videoQuota = computed<QuotaUsage>(() => {
    if (submitted.value) {
      return buildUsage(
        remainingVideoQuotaBytes.value,
        systemConfigStore.dailyVideoUploadSize,
        0,
        0,
        false,
      );
    }
    return buildUsage(
      remainingVideoQuotaBytes.value,
      systemConfigStore.dailyVideoUploadSize,
      sentVideoBytes.value,
      usedVideoQuotaBytes.value - sentVideoBytes.value,
      exceeds(remainingVideoQuotaBytes.value, usedVideoQuotaBytes.value),
    );
  });

  const imageQuota = computed<QuotaUsage>(() => {
    const pendingBytes =
      !submitted.value && shouldUploadCover.value ? coverQuotaCost.value : 0;
    return buildUsage(
      remainingImageQuotaBytes.value,
      systemConfigStore.dailyImageUploadSize,
      0,
      pendingBytes,
      exceeds(remainingImageQuotaBytes.value, pendingBytes),
    );
  });

  /** 打开页面时加载；刷新失败时保留原来的值 */
  async function loadUploadQuota() {
    const [videoQuota, imageQuota] = await Promise.all([
      quotaApi.getRemainingVideoUploadQuota(),
      quotaApi.getRemainingImageUploadQuota(),
    ]);

    if (videoQuota !== null) remainingVideoQuotaBytes.value = videoQuota;
    if (imageQuota !== null) remainingImageQuotaBytes.value = imageQuota;
    quotaLoading.value = false;
  }

  /** 投稿成功：先把本次占用记进剩余额度，再从后端刷新 */
  function commitSubmittedQuota() {
    if (remainingVideoQuotaBytes.value !== null) {
      remainingVideoQuotaBytes.value = Math.max(
        0,
        remainingVideoQuotaBytes.value - usedVideoQuotaBytes.value,
      );
    }
    if (remainingImageQuotaBytes.value !== null && shouldUploadCover.value) {
      remainingImageQuotaBytes.value = Math.max(
        0,
        remainingImageQuotaBytes.value - coverQuotaCost.value,
      );
    }
    loadUploadQuota();
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

  return {
    videoQuota,
    imageQuota,
    quotaLoading,
    shouldUploadCover,
    loadUploadQuota,
    commitSubmittedQuota,
    hasEnoughVideoQuota,
    setCoverQuotaBytes,
  };
}
