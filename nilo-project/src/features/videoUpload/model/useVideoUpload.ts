import { ref, reactive, computed } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import type { PreuploadVideoFile } from "./PreuploadVideoFile";
import type { VideoUpload as VideoUploadType } from "./VideoUpload";
import { VideoFileUploadApi } from "../api/VideoFileUploadApi";
import { imageApi } from "@/shared/api/ImageApi";
import type { AxiosProgressEvent } from "axios";
import message from "@/shared/lib/message";
import confirm from "@/shared/lib/confirm";
import { useSystemConfigStore } from "@/shared/store/SystemConfigStore";
import useCategoryStore from "@/shared/store/CategoryStore";

// ==================== constants ====================

/** Default chunk size: 5MB */
const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024;
const MAX_TAG_STRING_LENGTH = 300;

// ==================== category option types ====================

export interface CategoryOption {
  value: string;
  label: string;
}

export interface ParentCategoryOption extends CategoryOption {
  children: CategoryOption[];
}

// ==================== composable ====================

export function useVideoUpload() {
  // ==================== state ====================

  /** one-off variable, only get modified by once */
  const hasFileSelected = ref(false);
  /** preupload video file list */
  const preuploadList = ref<PreuploadVideoFile[]>([]);

  let uidCounter = 0;

  // ==================== cover blob ====================

  /**
   * 封面图片 Blob，由 CoverUpload 子组件通过 emit 同步。
   * 用户每次更换 / 裁剪封面时都会更新。
   */
  const coverBlob = ref<Blob | null>(null);

  // ==================== stores ====================

  const systemConfigStore = useSystemConfigStore();
  const categoryStore = useCategoryStore();

  // ==================== form state ====================

  const form = reactive<VideoUploadType>({
    coverPath: "",
    videoTitle: "",
    categoryNumber: "",
    postType: 1,
    tags: "",
    introduction: "",
    originInfo: "",
    interaction: "",
    videoFileUploadList: [],
  });

  // ==================== category select ====================

  /** 所有「子分类」的 categoryNumber 集合，用于从扁列表中筛掉子级 */
  const childNumberSet = computed<Set<string>>(() => {
    const set = new Set<string>();
    for (const item of categoryStore.categoryList) {
      if (item.children) {
        for (const child of item.children) {
          set.add(child.categoryNumber);
        }
      }
    }
    return set;
  });

  /** 父分类选项（仅包含真正的父级，并预转换 children） */
  const parentCategoryOptions = computed<ParentCategoryOption[]>(() =>
    categoryStore.categoryList
      .filter(c => !childNumberSet.value.has(c.categoryNumber))
      .map(c => ({
        value: c.categoryNumber,
        label: c.categoryName,
        children: (c.children ?? []).map(child => ({
          value: child.categoryNumber,
          label: child.categoryName,
        })),
      })),
  );

  /** 当前下拉栏选中的父分类 number（纯本地状态） */
  const selectedParentNumber = ref("");

  /** 当前下拉栏选中的子分类 number（纯本地状态，空串表示未选子级） */
  const selectedChildNumber = ref("");

  /** 当前选中的父分类选项 */
  const selectedParent = computed<ParentCategoryOption | undefined>(() =>
    parentCategoryOptions.value.find(
      c => c.value === selectedParentNumber.value,
    ),
  );

  /** 子分类选项（首项为「不选子分类」的空选项） */
  const childCategoryOptions = computed<CategoryOption[]>(() => {
    const children = selectedParent.value?.children ?? [];
    return [{ value: "", label: "不指定二级分类" }, ...children];
  });

  /** 将下拉栏选择同步到 form.categoryNumber（子级优先） */
  function syncCategoryNumber() {
    form.categoryNumber =
      selectedChildNumber.value || selectedParentNumber.value;
  }

  /** 父分类变更时：清空子分类，重新同步 */
  function onParentCategoryChange() {
    selectedChildNumber.value = "";
    syncCategoryNumber();
  }

  /** 子分类变更时：重新同步 */
  function onChildCategoryChange() {
    syncCategoryNumber();
  }

  // ==================== interaction checkboxes ====================

  const closeDanmaku = ref(false);
  const closeComment = ref(false);

  function syncInteraction() {
    const parts: string[] = [];
    if (closeDanmaku.value) parts.push("1");
    if (closeComment.value) parts.push("2");
    form.interaction = parts.join(",");
  }

  // ==================== helper functions ====================

  /** Strip file extension from filename, e.g. "video.mp4" → "video" */
  function stripExtension(filename: string): string {
    const lastDot = filename.lastIndexOf(".");
    return lastDot > 0 ? filename.substring(0, lastDot) : filename;
  }

  function formatMB(bytes: number): string {
    return (bytes / 1024 / 1024).toFixed(2);
  }

  function uploadProgress(item: PreuploadVideoFile): number {
    if (item.fileSize === 0) return 0;
    return Math.round((item.uploadedBytes / item.fileSize) * 100);
  }

  /**
   * Extract video duration (in seconds) from a File object.
   * Returns 0 if unable to read duration (e.g. unsupported format, load error).
   */
  function getVideoDuration(file: File): Promise<number> {
    return new Promise(resolve => {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(video.duration || 0);
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(0);
      };

      video.src = url;
    });
  }

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
        `"${file.name}" 文件过大（${formatMB(file.size)}MB），` +
          `最大允许 ${systemConfigStore.videoFileMaxSize}MB`,
      );
      return false;
    }

    // 3. Duration limit (config is in minutes)
    const maxDurationSeconds = systemConfigStore.maxPartitionDuration * 60;
    if (systemConfigStore.maxPartitionDuration > 0) {
      const durationSec = await getVideoDuration(file);
      if (durationSec > 0 && durationSec > maxDurationSeconds) {
        const durationMin = Math.round(durationSec / 60);
        message.error(
          `"${file.name}" 时长过长（${durationMin}分钟），` +
            `最大允许 ${systemConfigStore.maxPartitionDuration}分钟`,
        );
        return false;
      }
    }

    return true;
  }

  // ==================== build item ====================

  function buildPreuploadFile(file: File): PreuploadVideoFile {
    const totalChunks = Math.ceil(file.size / DEFAULT_CHUNK_SIZE);
    return {
      uid: `preupload_${Date.now()}_${++uidCounter}`,
      file,
      filename: stripExtension(file.name),
      fileSize: file.size,
      chunkSize: DEFAULT_CHUNK_SIZE,
      totalChunks,
      uploadId: null,
      uploadedBytes: 0,
      status: "pending",
      abortController: new AbortController(),
    };
  }

  // ==================== file selection ====================

  async function onFileSelected(file: File) {
    // Validate before accepting the file
    const valid = await validateVideoFile(file);
    if (!valid) return;

    hasFileSelected.value = true;
    const item = buildPreuploadFile(file);
    preuploadList.value.push(item);
    startUpload(item);
  }

  // ==================== delete logic ====================

  function removeItem(uid: string) {
    const index = preuploadList.value.findIndex(i => i.uid === uid);
    if (index === -1) return;
    const item = preuploadList.value[index]!;

    // Abort ongoing upload if still in progress
    if (item.status === "uploading" || item.status === "preuploading") {
      item.abortController?.abort();
    }

    // Always call deleteVideo if we have an uploadId (fire-and-forget)
    if (item.uploadId) {
      VideoFileUploadApi.deleteVideo(item.uploadId);
    }

    preuploadList.value.splice(index, 1);

    // If list becomes empty, go back to upload panel
    if (preuploadList.value.length === 0) {
      hasFileSelected.value = false;
    }
  }

  // ==================== upload logic ====================

  /**
   * Full upload pipeline for a single video file:
   * 1. preUploadVideo → obtain uploadId
   * 2. Split file into chunks
   * 3. Upload each chunk sequentially, reporting progress
   */
  async function startUpload(item: PreuploadVideoFile) {
    const reactiveItem = preuploadList.value.find(i => i.uid === item.uid);
    if (!reactiveItem) return;

    const signal = reactiveItem.abortController?.signal;

    // Step 1: pre-upload to get uploadId
    reactiveItem.status = "preuploading";
    try {
      const uploadId = await VideoFileUploadApi.preUploadVideo(
        reactiveItem.totalChunks,
        signal,
      );
      if (!uploadId) {
        reactiveItem.status = "error";
        reactiveItem.errorMsg = "preUploadVideo failed";
        message.error(`"${reactiveItem.filename}" 预上传失败！`);
        return;
      }
      reactiveItem.uploadId = uploadId;
    } catch (err: any) {
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
      reactiveItem.status = "error";
      reactiveItem.errorMsg = err?.msg ?? "preUploadVideo exception";
      message.error(`"${reactiveItem.filename}" 预上传异常！`);
      return;
    }

    // Step 2 & 3: chunk and upload
    reactiveItem.status = "uploading";
    const totalChunks = reactiveItem.totalChunks;
    const chunkSize = reactiveItem.chunkSize;
    const uploadId = reactiveItem.uploadId;

    for (let i = 0; i < totalChunks; i++) {
      const chunkIndex = i + 1;
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, reactiveItem.fileSize);
      const blob = reactiveItem.file.slice(start, end);
      // Convert Blob to File (backend expects MultipartFile)
      const chunkFile = new File(
        [blob],
        `${reactiveItem.file.name}.part${chunkIndex}`,
        {
          type: reactiveItem.file.type,
        },
      );

      // Track per-chunk progress: offset of already-uploaded bytes before this chunk
      const offsetBeforeChunk = i * chunkSize;

      try {
        const success = await VideoFileUploadApi.uploadVideo(
          chunkFile,
          chunkIndex,
          uploadId,
          (event: AxiosProgressEvent) => {
            if (event.loaded !== undefined) {
              reactiveItem.uploadedBytes = offsetBeforeChunk + event.loaded;
            }
          },
          signal,
        );
        if (!success) {
          reactiveItem.status = "error";
          reactiveItem.errorMsg = `Chunk ${chunkIndex} upload failed`;
          message.error(`"${reactiveItem.filename}" 上传失败！`);
          return;
        }
      } catch (err: any) {
        if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED")
          return;
        reactiveItem.status = "error";
        reactiveItem.errorMsg =
          err?.msg ?? `Chunk ${chunkIndex} upload exception`;
        message.error(`"${reactiveItem.filename}" 上传时出现异常！`);
        return;
      }

      // Ensure uploadedBytes caps at fileSize for the last chunk
      reactiveItem.uploadedBytes = Math.min(
        offsetBeforeChunk + blob.size,
        reactiveItem.fileSize,
      );
    }

    // Upload complete
    reactiveItem.status = "done";
    message.success(`"${reactiveItem.filename}" 上传完成`);
  }

  // ==================== ready uploadId list ====================

  /** 从 preuploadList 中提取所有已上传完成的 VideoFileUploadItem */
  const readyUploadIdList = computed(() =>
    preuploadList.value
      .filter(item => item.status === "done" && item.uploadId !== null)
      .map(item => ({
        uploadId: item.uploadId!,
        filename: item.filename,
      })),
  );

  // ==================== form validation ====================

  /** 表单是否通过前端校验（必填项非空、字符串非空白） */
  const isFormValid = computed(() => {
    // 视频标题 - 必填且不能为空白
    if (!form.videoTitle.trim()) return false;
    // 分类 - 必填（至少选择一级分类）
    if (!form.categoryNumber) return false;
    // 类型 - 如果是转载，必须填写来源说明
    if (form.postType === 2 && !form.originInfo?.trim()) return false;
    return true;
  });

  // ==================== submit ====================

  const submitting = ref(false);

  async function submitVideo() {
    // 基础校验
    if (!form.videoTitle.trim()) {
      message.error("请输入视频标题");
      return;
    }
    if (!form.categoryNumber) {
      message.error("请选择分区");
      return;
    }
    if (form.postType === 2 && !form.originInfo?.trim()) {
      message.error("转载视频请填写原资源说明");
      return;
    }
    if (readyUploadIdList.value.length === 0) {
      message.error("请等待视频文件上传完成后再提交");
      return;
    }
    if (form.tags?.length && form.tags?.length > MAX_TAG_STRING_LENGTH) {
      message.error("标签太长啦，请缩短标签长度");
      return;
    }

    // 同步互动设置
    syncInteraction();

    // 上传封面图片（校验通过后仅在此处上传，避免用户反复调整时浪费带宽和存储）
    if (coverBlob.value) {
      try {
        // coverBlob 本身已携带 MIME type（autoCropToCover 编码为 image/jpeg），无需额外检测
        const coverFile = new File([coverBlob.value], "cover.jpg", {
          type: coverBlob.value.type || "image/jpeg",
        });
        const coverPath = await imageApi.uploadImage(coverFile);
        if (coverPath) {
          form.coverPath = String(coverPath);
        } else {
          message.error("封面上传失败，请重试");
          return;
        }
      } catch {
        message.error("封面上传异常，请重试");
        return;
      }
    }

    // 组装 videoFileUploadList（uploadId + 用户自定义 filename）
    form.videoFileUploadList = readyUploadIdList.value;

    submitting.value = true;
    try {
      const success = await VideoFileUploadApi.postVideo(form);
      if (success) {
        message.success("视频发布成功！");
      }
    } finally {
      submitting.value = false;
    }
  }

  // ==================== cleanup ====================

  /**
   * Batch cleanup all items: abort ongoing uploads, call deleteVideo API,
   * and clear the list. Use this when leaving the page.
   */
  function cleanupAll() {
    for (const item of preuploadList.value) {
      // Abort ongoing upload if still in progress
      if (item.status === "uploading" || item.status === "preuploading") {
        item.abortController?.abort();
      }
      // Fire-and-forget deleteVideo API
      if (item.uploadId) {
        VideoFileUploadApi.deleteVideo(item.uploadId);
      }
    }
    preuploadList.value = [];
    hasFileSelected.value = false;
  }

  /** Check whether there are any items that have data to lose */
  function hasPendingData(): boolean {
    return preuploadList.value.length > 0;
  }

  // ==================== route leave guard ====================

  onBeforeRouteLeave((_to, _from, next) => {
    if (!hasPendingData()) {
      next();
      return;
    }

    confirm({
      message: "离开此页面将丢失当前所有上传数据，确认退出？",
      confirmText: "确认退出",
      confirmFun: () => {
        cleanupAll();
        next();
      },
    });
  });

  // ==================== return ====================

  return {
    // state — upload
    hasFileSelected,
    preuploadList,
    // state — form
    form,
    // state — category
    parentCategoryOptions,
    selectedParentNumber,
    selectedChildNumber,
    childCategoryOptions,
    onParentCategoryChange,
    onChildCategoryChange,
    // state — interaction
    closeDanmaku,
    closeComment,
    // state — derived
    readyUploadIdList,
    isFormValid,
    // state — submit
    submitting,
    submitVideo,
    // state — cover
    coverBlob,
    // methods — upload
    onFileSelected,
    formatMB,
    uploadProgress,
    removeItem,
    cleanupAll,
    hasPendingData,
  };
}
