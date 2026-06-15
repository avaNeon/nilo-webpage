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
import { useSystemConfigStore } from "@/shared/store/SystemConfigStore";
import { useUploadQuota } from "./useUploadQuota";

/**
 * @name useVideoUpload
 * @description this hook saved all state and function that the layout need, layout should not respectively import modules by its own
 */
export function useVideoUpload() {
  // ==================== 外部依赖 ====================

  const { DEFAULT_CHUNK_SIZE, MAX_TAG_STRING_LENGTH, MAX_INTRODUCTION_LENGTH } =
    useVideoUploadConfig();

  const {
    categoryOptions,
    selectedParentNumber,
    selectedChildNumber,
    childCategoryOptions,
    onParentCategoryChange: changeParentCategory,
    onChildCategoryChange: changeChildCategory,
    syncCategorySelectionByCategoryNumber,
  } = useCategoryTag();

  const { validateVideoFile } = useFileValidation();
  const systemConfigStore = useSystemConfigStore();

  const route = useRoute();
  const router = useRouter();

  // ==================== 状态：上传流程 ====================

  /** one-off variable, only get modified by once */
  const hasFileSelected = ref(false);

  /** preupload video file list */
  const preuploadList = ref<PreuploadVideoFile[]>([]);
  const submitState = ref(false);
  const submitting = ref(false);
  const formResetKey = ref(0);

  let uidCounter = 0;

  function createEmptyForm(): VideoUploadType {
    return {
      coverPath: "",
      videoTitle: "",
      categoryNumber: "",
      postType: 1,
      tags: "",
      introduction: "",
      originInfo: "",
      interaction: "",
      videoFileUploadList: [],
    };
  }

  // ==================== 状态：编辑模式 ====================

  const modifiedVideoId = ref<string | null>(null);
  const isEditMode = computed(() => !!modifiedVideoId.value);

  // ==================== 状态：封面 ====================

  /**
   * 封面图片 Blob，由 CoverUpload 子组件通过 emit 同步。
   * 用户每次更换 / 裁剪封面时都会更新。
   */
  const coverBlob = ref<Blob | null>(null);

  // ==================== 状态：表单 ====================

  const form = reactive<VideoUploadType>(createEmptyForm());

  const tagList = ref<string[]>([]);
  const closeDanmaku = ref(false);
  const closeComment = ref(false);

  // ==================== 状态：衍生数据 ====================

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

  const maxVideoEpisodes = computed(() =>
    systemConfigStore.videoMaxEpisodes > 0
      ? systemConfigStore.videoMaxEpisodes
      : 0,
  );

  const hasExceededVideoEpisodes = computed(
    () =>
      maxVideoEpisodes.value > 0 &&
      preuploadList.value.length > maxVideoEpisodes.value,
  );

  const {
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
  } = useUploadQuota(preuploadList, coverBlob);

  /**
   * 简介有效字符数：将每个真实换行符 \n 计为 2 个字符（对应转义后 \\n），
   * 与提交时发送给后端的实际长度一致。
   */
  const introductionCharCount = computed(() =>
    StringUtil.getEscapedNewlineLength(form.introduction),
  );

  /** 表单是否通过前端校验（必填项非空、字符串非空白） */
  const isFormValid = computed(() => {
    // 封面 - 必填
    if (coverBlob.value === null) {
      return false;
    }
    // 视频标题 - 必填且不能为空白
    if (!form.videoTitle.trim()) {
      return false;
    }
    // 分类 - 必填（至少选择一级分类）
    if (!form.categoryNumber) {
      return false;
    }
    // 类型 - 如果是转载，必须填写来源说明
    if (form.postType === 2 && !form.originInfo?.trim()) {
      return false;
    }
    // 简介长度（计入换行符转义后的等效长度）
    if (introductionCharCount.value > MAX_INTRODUCTION_LENGTH) {
      return false;
    }
    if (hasExceededVideoEpisodes.value) {
      return false;
    }
    return true;
  });

  // ==================== 初始化方法 ====================

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

  async function initEditVideoFromRoute() {
    if (route.query.mode !== "edit") return;

    const videoId = String(route.query.videoId ?? "");
    if (!videoId) return;

    modifiedVideoId.value = videoId;
    if (!(await loadEditVideo(videoId))) {
      router.replace({ query: {} });
    }
  }

  // ==================== 方法：本地文件列表 ====================

  function buildPreuploadFile(file: File): PreuploadVideoFile {
    return UploadUtil.buildPreuploadFile(
      file,
      DEFAULT_CHUNK_SIZE,
      `preupload_${Date.now()}_${++uidCounter}`,
    );
  }

  /** 选择新视频文件，只加入本地待提交列表，不立即上传。 */
  async function onFileSelected(file: File) {
    if (submitting.value) return;

    // Validate before accepting the file
    const valid = await validateVideoFile(file);
    if (!valid) return;
    if (!hasEnoughVideoQuota(file)) {
      message.warning(`"${file.name}" 超出今日剩余视频上传额度`);
      return;
    }

    hasFileSelected.value = true;
    const item = buildPreuploadFile(file);
    preuploadList.value.push(item);
  }

  /** 删除本地待提交分P */
  function removeItem(uid: string) {
    if (submitting.value) return;

    const index = preuploadList.value.findIndex(i => i.uid === uid);
    if (index === -1) return;

    preuploadList.value.splice(index, 1);
  }

  /** 返回初始上传面板，并清空本地待提交数据。 */
  function returnToUploadPanel() {
    if (submitting.value) return;

    hasFileSelected.value = false;
    cleanupAll();
  }

  /**
   * Clear all local upload items. During submitting this is intentionally ignored
   * because uploaded files must not be interrupted or withdrawn from the client.
   */
  function cleanupAll() {
    if (submitting.value) return;

    preuploadList.value = [];
    hasFileSelected.value = false;
    modifiedVideoId.value = null;
    coverBlob.value = null;
    tagList.value = [];
    closeDanmaku.value = false;
    closeComment.value = false;
    selectedParentNumber.value = "";
    selectedChildNumber.value = "";
    Object.assign(form, createEmptyForm());
    setCoverQuotaBytes(0);
    formResetKey.value++;
  }

  /** Check whether there are any items that have data to lose */
  function hasPendingData(): boolean {
    return preuploadList.value.length > 0;
  }

  // ==================== 方法：分类与互动 ====================

  /** 同步互动设置到提交表单。 */
  function syncInteraction() {
    form.interaction = UploadUtil.buildInteractionValue(
      closeDanmaku.value,
      closeComment.value,
    );
  }

  /** 一级分区改变时重置二级分区；提交上传期间不会响应。 */
  function onParentCategoryChange() {
    if (submitting.value) return;

    changeParentCategory();
  }

  /** 二级分区改变处理；提交上传期间不会响应。 */
  function onChildCategoryChange() {
    if (submitting.value) return;

    changeChildCategory();
  }

  // ==================== 方法：上传文件 ====================

  /**
   * Full upload pipeline for a single video file:
   * 1. preUploadVideo → obtain uploadId
   * 2. Split file into chunks
   * 3. Upload each chunk sequentially, reporting progress
   */
  async function startUpload(item: PreuploadVideoFile) {
    const reactiveItem = preuploadList.value.find(i => i.uid === item.uid);
    if (!reactiveItem) return;

    if (reactiveItem.isExisting) return;
    if (reactiveItem.status === "done") return;

    reactiveItem.uploadId = null;
    reactiveItem.uploadedBytes = 0;
    reactiveItem.errorMsg = undefined;

    // Step 1: pre-upload to get uploadId
    reactiveItem.status = "preuploading";
    try {
      const uploadId = await videoUploadApi.preUploadVideo(
        reactiveItem.totalChunks,
      );
      if (!uploadId) {
        reactiveItem.status = "error";
        reactiveItem.errorMsg = "preUploadVideo failed";
        message.error(`"${reactiveItem.filename}" 预上传失败！`);
        return;
      }
      reactiveItem.uploadId = uploadId;
    } catch (err: any) {
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
        );
        if (!success) {
          reactiveItem.status = "error";
          reactiveItem.errorMsg = `Chunk ${chunkIndex} upload failed`;
          message.error(`"${reactiveItem.filename}" 上传失败！`);
          return;
        }
      } catch (err: any) {
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

  /** 顺序上传所有新增文件；旧文件只保留 uploadId 参与提交。 */
  async function uploadPendingFiles(): Promise<boolean> {
    const filesToUpload = preuploadList.value.filter(
      item => !item.isExisting && item.status !== "done",
    );

    for (const item of filesToUpload) {
      await startUpload(item);
      const latestItem = preuploadList.value.find(i => i.uid === item.uid);
      if (!latestItem || latestItem.status !== "done") {
        return false;
      }
    }

    return true;
  }

  // ==================== 方法：提交校验 ====================

  /** 提交前做阻断式校验，失败时直接提示用户。 */
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
    if (preuploadList.value.length === 0) {
      message.error("请选择视频文件");
      return false;
    }
    if (hasExceededVideoEpisodes.value) {
      message.error(`单个视频最多只能提交 ${maxVideoEpisodes.value} 个分P`);
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

  // ==================== 方法：提交视频 ====================

  /** 提交视频信息；提交期间会锁定前端所有编辑和退出操作。 */
  async function submitVideo() {
    if (submitting.value) return;

    if (!validateSubmit()) return;

    submitting.value = true;

    // 同步互动设置
    syncInteraction();

    const uploadSuccess = await uploadPendingFiles();
    if (!uploadSuccess) {
      submitting.value = false;
      message.error("视频文件上传失败，请重试");
      return;
    }

    if (readyUploadFileList.value.length === 0) {
      submitting.value = false;
      message.error("没有可提交的视频文件");
      return;
    }

    // 仅上传本次新选择/裁剪的封面；编辑模式加载的原封面已在 form.coverPath 中，无需重复上传。
    if (shouldUploadCover.value && coverBlob.value) {
      try {
        // coverBlob 本身已携带 MIME type（autoCropToCover 编码为 image/jpeg），无需额外检测
        const coverFile = new File([coverBlob.value], "cover.jpg", {
          type: coverBlob.value.type || "image/jpeg",
        });

        // 获取相对路径
        const coverPath = await imageApi.uploadImage(coverFile);

        if (coverPath) {
          form.coverPath = String(coverPath);
        } else {
          message.error("封面上传失败，请重试");
          submitting.value = false;
          return;
        }
      } catch {
        message.error("封面上传异常，请重试");
        submitting.value = false;
        return;
      }
    }

    // 将简介中的真实换行符 \n（1个字符）转为转义字面 \\n（2个字符），便于后端保存
    const introductionEscaped = StringUtil.escapeNewline(form.introduction);

    // 组装 videoFileUploadList（uploadId + 用户自定义 filename）
    form.videoFileUploadList = readyUploadFileList.value;

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

  // ==================== 监听：分类同步 ====================

  /** 当 selectedParentNumber / selectedChildNumber 变化时，同步到 form.categoryNumber */
  watch(
    [selectedParentNumber, selectedChildNumber],
    ([parent, child]) => {
      form.categoryNumber = child || parent;
    },
    { immediate: true },
  );

  // ==================== 路由守卫 ====================

  onBeforeRouteLeave((_to, _from, next) => {
    if (submitting.value) {
      next(false);
      return;
    }

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

  // ==================== 生命周期 ====================

  onMounted(() => {
    initEditVideoFromRoute();
    loadUploadQuota();
  });

  // ==================== return ====================

  return {
    // state — upload
    hasFileSelected,
    preuploadList,
    submitState,
    formResetKey,
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
    maxVideoEpisodes,
    hasExceededVideoEpisodes,
    remainingVideoQuotaMiB,
    remainingImageQuotaMiB,
    videoQuotaPercent,
    imageQuotaPercent,
    usedVideoQuotaBytes,
    usedImageQuotaBytes,
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
    setCoverQuotaBytes,
    formatMiB,
  };
}
