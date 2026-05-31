import { ref, reactive, computed, onMounted, watch } from "vue";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";
import type { PreuploadVideoFile } from "./PreuploadVideoFile";
import type { VideoUpload as VideoUploadType } from "./VideoUpload";
import { videoUploadApi } from "@/shared/api/VideoUploadApi";
import { imageApi } from "@/shared/api/ImageApi";
import type { AxiosProgressEvent } from "axios";
import message from "@/shared/lib/message";
import confirm from "@/shared/lib/confirm";
import { FileUtil } from "@/shared/utils/FileUtil";
import { UploadUtil } from "@/shared/utils/UploadUtil";
import { StringUtil } from "@/shared/utils/StringUtil";
import { useVideoUploadEditFlow } from "./useVideoUploadEditFlow";
import { useVideoUploadConfig } from "./useVideoUploadConfig";
import { useCategoryTag } from "./useCategoryTag";
import { useFileValidation } from "./useFileValidation";

/**
 * @name useVideoUpload
 * @description this hook saved all state and function that the layout need, layout should not respectively import modules by its own
 */
export function useVideoUpload() {
  const { DEFAULT_CHUNK_SIZE, MAX_TAG_STRING_LENGTH, MAX_INTRODUCTION_LENGTH } =
    useVideoUploadConfig();

  const {
    categoryOptions,
    selectedParentNumber,
    selectedChildNumber,
    childCategoryOptions,
    onParentCategoryChange,
    onChildCategoryChange,
    syncCategorySelectionByCategoryNumber,
  } = useCategoryTag();

  const { validateVideoFile } = useFileValidation();

  const route = useRoute();
  const router = useRouter();
  // ==================== state ====================

  /** one-off variable, only get modified by once */
  const hasFileSelected = ref(false);

  /** preupload video file list */
  const preuploadList = ref<PreuploadVideoFile[]>([]);
  const modifiedVideoId = ref<string | null>(null);
  const isEditMode = computed(() => !!modifiedVideoId.value);
  const tagList = ref<string[]>([]);
  const submitState = ref(false);

  let uidCounter = 0;

  // ==================== cover blob ====================

  /**
   * 封面图片 Blob，由 CoverUpload 子组件通过 emit 同步。
   * 用户每次更换 / 裁剪封面时都会更新。
   */
  const coverBlob = ref<Blob | null>(null);

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

  // ==================== interaction checkboxes ====================

  const closeDanmaku = ref(false);
  const closeComment = ref(false);

  function syncInteraction() {
    form.interaction = UploadUtil.buildInteractionValue(
      closeDanmaku.value,
      closeComment.value,
    );
  }

  const { loadEditVideo } = useVideoUploadEditFlow(
    form,
    preuploadList,
    hasFileSelected,
    closeDanmaku,
    closeComment,
    tagList,
    syncCategorySelectionByCategoryNumber,
    DEFAULT_CHUNK_SIZE,
  );

  // ==================== build item ====================

  function buildPreuploadFile(file: File): PreuploadVideoFile {
    return UploadUtil.buildPreuploadFile(
      file,
      DEFAULT_CHUNK_SIZE,
      `preupload_${Date.now()}_${++uidCounter}`,
    );
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
      if (!item.isExisting) {
        videoUploadApi.deleteVideo(item.uploadId);
      }
    }

    preuploadList.value.splice(index, 1);
  }

  function returnToUploadPanel() {
    hasFileSelected.value = false;
    cleanupAll();
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
      const uploadId = await videoUploadApi.preUploadVideo(
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
    const sourceFile = reactiveItem.file;
    if (!uploadId || !sourceFile) {
      reactiveItem.status = "error";
      reactiveItem.errorMsg = "missing uploadId or file";
      return;
    }

    for (let i = 0; i < totalChunks; i++) {
      const chunkIndex = i + 1;
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, reactiveItem.fileSize);
      const blob = sourceFile.slice(start, end);
      // Convert Blob to File (backend expects MultipartFile)
      const chunkFile = new File(
        [blob],
        `${sourceFile.name}.part${chunkIndex}`,
        {
          type: sourceFile.type,
        },
      );

      // Track per-chunk progress: offset of already-uploaded bytes before this chunk
      const offsetBeforeChunk = i * chunkSize;

      try {
        const success = await videoUploadApi.uploadVideo(
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
  const readyUploadFileList = computed(() =>
    preuploadList.value
      .filter(
        item =>
          item.status === "done" &&
          item.uploadId !== null &&
          // 转码失败的旧文件不参与提交
          !(item.isExisting && item.transferResult === 2),
      )
      .map(item => ({
        uploadId: item.uploadId!,
        filename: item.filename,
      })),
  );

  const hasMissingExistingUploadId = computed(() =>
    preuploadList.value.some(
      item =>
        item.isExisting && item.status === "done" && item.uploadId === null,
    ),
  );

  // ==================== form validation ====================

  /**
   * 简介有效字符数：将每个真实换行符 \n 计为 2 个字符（对应转义后 \\n），
   * 与提交时发送给后端的实际长度一致。
   */
  const introductionCharCount = computed(() => {
    return StringUtil.getEscapedNewlineLength(form.introduction);
  });

  /** 表单是否通过前端校验（必填项非空、字符串非空白） */
  const isFormValid = computed(() => {
    // 封面 - 必填
    if (coverBlob.value === null) {
      console.log("等待上传封面");
      return false;
    }
    // 视频标题 - 必填且不能为空白
    if (!form.videoTitle.trim()) {
      console.log("视频标题不能为空");
      return false;
    }
    // 分类 - 必填（至少选择一级分类）
    if (!form.categoryNumber) {
      console.log("请选择分区");
      return false;
    }
    // 类型 - 如果是转载，必须填写来源说明
    if (form.postType === 2 && !form.originInfo?.trim()) {
      console.log("转载视频请填写原资源说明");
      return false;
    }
    // 简介长度（计入换行符转义后的等效长度）
    if (introductionCharCount.value > MAX_INTRODUCTION_LENGTH) {
      console.log("简介长度超出限制");
      return false;
    }
    return true;
  });

  // ==================== submit ====================

  const submitting = ref(false);

  function validateSubmit(): boolean {
    if (!form.videoTitle.trim()) {
      message.error("请输入视频标题");
      return false;
    }
    if (!form.categoryNumber) {
      message.error("请选择分区");
      return false;
    }
    if (form.postType === 2 && !form.originInfo?.trim()) {
      message.error("转载视频请填写原资源说明");
      return false;
    }
    if (readyUploadFileList.value.length === 0) {
      message.error("请等待视频文件上传完成后再提交");
      return false;
    }
    if (isEditMode.value && hasMissingExistingUploadId.value) {
      message.error(
        "存在旧分P缺少 uploadId，暂无法提交编辑，请联系后端确认接口返回",
      );
      return false;
    }
    if ((form.tags?.length ?? 0) > MAX_TAG_STRING_LENGTH) {
      message.error("标签太长啦，请缩短标签长度");
      return false;
    }
    return true;
  }

  async function submitVideo() {
    if (!validateSubmit()) return;

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

    // 将简介中的真实换行符 \n（1个字符）转为转义字面 \\n（2个字符），便于后端保存
    const introductionEscaped = StringUtil.escapeNewline(form.introduction);

    // 组装 videoFileUploadList（uploadId + 用户自定义 filename）
    form.videoFileUploadList = readyUploadFileList.value;

    submitting.value = true;
    try {
      const success = await videoUploadApi.postVideo({
        ...form,
        videoId: modifiedVideoId.value ?? undefined,
        introduction: introductionEscaped,
      });
      if (success) {
        message.success(isEditMode.value ? "视频修改成功！" : "视频发布成功！");
        submitState.value = true;
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
      if (item.uploadId && !item.isExisting) {
        videoUploadApi.deleteVideo(item.uploadId);
      }
    }
    preuploadList.value = [];
    hasFileSelected.value = false;
  }

  /** Check whether there are any items that have data to lose */
  function hasPendingData(): boolean {
    return preuploadList.value.length > 0;
  }

  // ==================== sync category selection to form ====================

  /** 当 selectedParentNumber / selectedChildNumber 变化时，同步到 form.categoryNumber */
  watch(
    [selectedParentNumber, selectedChildNumber],
    ([parent, child]) => {
      form.categoryNumber = child || parent;
    },
    { immediate: true },
  );

  // ==================== route leave guard ====================

  onBeforeRouteLeave((_to, _from, next) => {
    if (!hasPendingData() || submitState.value) {
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

  onMounted(async () => {
    // update initialization
    if (route.query.mode === "edit") {
      const videoId = String(route.query.videoId ?? "");
      if (!videoId) return;
      modifiedVideoId.value = videoId;
      if (!(await loadEditVideo(videoId))) {
        router.replace({ query: {} });
      }
    }
  });

  // ==================== return ====================

  return {
    // state — upload
    hasFileSelected,
    preuploadList,
    submitState,
    isEditMode,
    tagList,
    // state — form
    form,
    // state — interaction
    closeDanmaku,
    closeComment,
    // state — derived
    readyUploadFileList,
    hasMissingExistingUploadId,
    isFormValid,
    introductionCharCount,
    // state — submit
    submitting,
    submitVideo,
    // state — cover
    coverBlob,
    // category
    categoryOptions,
    selectedParentNumber,
    selectedChildNumber,
    childCategoryOptions,
    onParentCategoryChange,
    onChildCategoryChange,
    // methods — upload
    onFileSelected,
    formatMB: FileUtil.formatMB,
    uploadProgress: UploadUtil.calcProgressPercent,
    removeItem,
    returnToUploadPanel,
    cleanupAll,
    hasPendingData,
  };
}
