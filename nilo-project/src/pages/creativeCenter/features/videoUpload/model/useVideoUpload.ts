import { ref, reactive, computed, onMounted, watch } from "vue";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";
import {
  isTransferFailedFile,
  type PreuploadVideoFile,
} from "./PreuploadVideoFile";
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

export function useVideoUpload() {
  /* —————— 外部依赖 —————— */

  const { MAX_TAG_STRING_LENGTH, MAX_INTRODUCTION_LENGTH } =
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

  /* —————— 表单 —————— */

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

  /** 封面 Blob——CoverUpload 子组件通过 emit 实时同步 */
  const coverBlob = ref<Blob | null>(null);

  /** VideoTag 组件双向绑定的标签列表 */
  const tagList = ref<string[]>([]);

  const closeDanmaku = ref(false);
  const closeComment = ref(false);

  /**
   * 简介等效字符数：\\n（1 个字符）在提交时会转义为 \\\\n（2 个字符），
   * 这里提前以 2 个等效字符计算长度，与后端实际长度一致。
   */
  const introductionCharCount = computed(() =>
    StringUtil.getEscapedNewlineLength(form.introduction),
  );

  /* —————— 分P文件列表 —————— */

  const preuploadList = ref<PreuploadVideoFile[]>([]);

  let uidCounter = 0;

  function buildPreuploadFile(file: File): PreuploadVideoFile {
    return UploadUtil.buildPreuploadFile(
      file,
      `preupload_${Date.now()}_${++uidCounter}`,
    );
  }

  /**
   * 用户选择新视频后只加入本地列表，不立即上传
   * 实际上传由 submitVideo 统一触发
   */
  async function onFileSelected(file: File) {
    if (submitting.value) return;

    if (!(await validateVideoFile(file))) return;

    if (!hasEnoughVideoQuota(file)) {
      message.warning(`"${file.name}" 超出今日剩余视频上传额度`);
      return;
    }

    hasFileSelected.value = true;
    preuploadList.value.push(buildPreuploadFile(file));
  }

  function removeItem(uid: string) {
    if (submitting.value) return;

    const index = preuploadList.value.findIndex(i => i.uid === uid);
    if (index === -1) return;
    // 转码失败文件仅展示，不可删除/提交
    if (isTransferFailedFile(preuploadList.value[index]!)) return;
    preuploadList.value.splice(index, 1);
  }

  function hasPendingData(): boolean {
    return preuploadList.value.length > 0;
  }

  /**
   * 清空所有本地上传数据。
   * 提交中忽略此操作，防止已上传的文件被意外中断。
   */
  function cleanupAll() {
    if (submitting.value) return;

    preuploadList.value = [];
    hasFileSelected.value = false;
    modifiedVideoId.value = null;
    editVideoStatus.value = null;
    coverBlob.value = null;
    tagList.value = [];
    closeDanmaku.value = false;
    closeComment.value = false;
    selectedParentNumber.value = "";
    selectedChildNumber.value = "";
    Object.assign(form, {
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
    setCoverQuotaBytes(0);
    formResetKey.value++;
  }

  /** 返回初始上传面板并清空数据 */
  function returnToUploadPanel() {
    if (submitting.value) return;

    hasFileSelected.value = false;
    cleanupAll();
  }

  /* —————— 上传流程控制 —————— */

  /** 是否已经选择文件——切换初始上传面板 / 编辑面板的标志位 */
  const hasFileSelected = ref(false);

  /** 提交成功后展示 UploadSuccess 组件 */
  const submitState = ref(false);

  /** 提交中锁——禁止所有用户交互 */
  const submitting = ref(false);

  /** CoverUpload 组件 key，用于重置封面裁剪状态 */
  const formResetKey = ref(0);

  /* —————— 编辑模式 —————— */

  const modifiedVideoId = ref<string | null>(null);
  const isEditMode = computed(() => !!modifiedVideoId.value);
  /** 编辑中稿件状态（转码失败分 P 等逻辑用） */
  const editVideoStatus = ref<number | null>(null);

  const { loadEditVideo } = useVideoUploadEditFlow(
    form,
    preuploadList,
    hasFileSelected,
    closeDanmaku,
    closeComment,
    tagList,
    syncCategorySelectionByCategoryNumber,
    editVideoStatus,
  );

  /** 根据路由 query 判断是否进入编辑模式并加载已有视频数据 */
  async function initEditVideoFromRoute() {
    if (route.query.mode !== "edit") return;

    const videoId = String(route.query.videoId ?? "");
    if (!videoId) return;

    modifiedVideoId.value = videoId;
    if (!(await loadEditVideo(videoId))) {
      router.replace({ query: {} });
    }
  }

  /* —————— 衍生计算 —————— */

  /** 可编辑/可计数的分 P（排除转码失败项） */
  const editablePreuploadList = computed(() =>
    preuploadList.value.filter(item => !isTransferFailedFile(item)),
  );

  /** 可提交分 P：done 且有 key/fileId，排除转码失败项 */
  const readyUploadFileList = computed(() =>
    editablePreuploadList.value
      .filter(
        item =>
          item.status === "done" &&
          (item.key !== null || item.fileId !== null),
      )
      .map(item => {
        if (item.isExisting && item.fileId) {
          return { fileId: item.fileId, filename: item.filename };
        }
        return { key: item.key!, filename: item.filename };
      }),
  );

  /** 是否存在旧文件已完成但缺少 fileId（数据异常，不可提交；转码失败项不计入） */
  const hasMissingExistingFileId = computed(() =>
    editablePreuploadList.value.some(
      item => item.isExisting && item.status === "done" && item.fileId === null,
    ),
  );

  /** 单个视频最大分P数（0 表示无限制） */
  const maxVideoEpisodes = computed(() =>
    systemConfigStore.videoMaxEpisodes > 0
      ? systemConfigStore.videoMaxEpisodes
      : 0,
  );

  const hasExceededVideoEpisodes = computed(
    () =>
      maxVideoEpisodes.value > 0 &&
      editablePreuploadList.value.length > maxVideoEpisodes.value,
  );

  /** 表单前端校验：必填项非空、长度不超限 */
  const isFormValid = computed(() => {
    if (coverBlob.value === null) return false;
    if (!form.videoTitle.trim()) return false;
    if (!form.categoryNumber) return false;
    if (form.postType === 2 && !form.originInfo?.trim()) return false;
    if (introductionCharCount.value > MAX_INTRODUCTION_LENGTH) return false;
    if (hasExceededVideoEpisodes.value) return false;
    return true;
  });

  /* —————— 上传额度 —————— */

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

  /* —————— 分类 & 互动 —————— */

  /** 将弹幕/评论开关转换为后端 interaction 字段值 */
  function syncInteraction() {
    form.interaction = UploadUtil.buildInteractionValue(
      closeDanmaku.value,
      closeComment.value,
    );
  }

  function onParentCategoryChange() {
    if (submitting.value) return;
    changeParentCategory();
  }

  function onChildCategoryChange() {
    if (submitting.value) return;
    changeChildCategory();
  }

  /* —————— 上传管线 —————— */

  /** 直传 MinIO；旧分 P / 已完成项跳过 */
  async function startUpload(item: PreuploadVideoFile) {
    const reactiveItem = preuploadList.value.find(i => i.uid === item.uid);
    if (!reactiveItem) return;

    if (reactiveItem.isExisting || reactiveItem.status === "done") return;

    const sourceFile = reactiveItem.file;
    if (!sourceFile) {
      reactiveItem.status = "error";
      reactiveItem.errorMsg = "missing file";
      return;
    }

    reactiveItem.key = null;
    reactiveItem.uploadedBytes = 0;
    reactiveItem.errorMsg = undefined;
    reactiveItem.status = "uploading";

    try {
      const plainKey = await videoUploadApi.uploadVideo(
        sourceFile,
        (event: AxiosProgressEvent) => {
          if (event.loaded !== undefined) {
            reactiveItem.uploadedBytes = event.loaded;
          }
        },
      );
      if (!plainKey) {
        reactiveItem.status = "error";
        reactiveItem.errorMsg = "uploadVideo failed";
        message.error(`"${reactiveItem.filename}" 上传失败！`);
        return;
      }
      reactiveItem.key = plainKey;
      reactiveItem.uploadedBytes = reactiveItem.fileSize;
      reactiveItem.status = "done";
      message.success(`"${reactiveItem.filename}" 上传完成`);
    } catch (err: any) {
      reactiveItem.status = "error";
      reactiveItem.errorMsg = err?.msg ?? err?.message ?? "upload exception";
      message.error(`"${reactiveItem.filename}" 上传时出现异常！`);
    }
  }

  /** 顺序上传 preuploadList 中所有待上传的新文件，任一失败则返回 false */
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

  /* —————— 提交 —————— */

  /** 提交前阻断式校验——失败时弹出对应错误提示 */
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
    if (editablePreuploadList.value.length === 0) {
      message.error("请选择视频文件");
      return false;
    }
    if (hasExceededVideoEpisodes.value) {
      message.error(`单个视频最多只能提交 ${maxVideoEpisodes.value} 个分P`);
      return false;
    }
    if (isEditMode.value && hasMissingExistingFileId.value) {
      message.error("存在旧分P缺少 fileId，暂无法提交编辑");
      return false;
    }
    if ((form.tags?.length ?? 0) > MAX_TAG_STRING_LENGTH) {
      message.error("标签太长啦，请缩短标签长度");
      return false;
    }
    return true;
  }

  /**
   * 提交入口：
   *   1. 阻断式校验
   *   2. 同步互动设置
   *   3. 上传所有待上传的新文件
   *   4. 上传新封面（如有）
   *   5. 组装 payload 并调用提交接口
   * 流程中 submitting 为 true，锁定所有前端编辑操作。
   */
  async function submitVideo() {
    if (submitting.value) return;

    if (!validateSubmit()) return;

    submitting.value = true;

    syncInteraction();

    // 上传所有待上传的新文件
    if (!(await uploadPendingFiles())) {
      submitting.value = false;
      message.error("视频文件上传失败，请重试");
      return;
    }

    if (readyUploadFileList.value.length === 0) {
      submitting.value = false;
      message.error("没有可提交的视频文件");
      return;
    }

    // 仅本次新裁剪的封面需要上传
    if (shouldUploadCover.value && coverBlob.value) {
      try {
        const coverFile = new File([coverBlob.value], "cover.jpg", {
          type: coverBlob.value.type || "image/jpeg",
        });
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

    form.videoFileUploadList = readyUploadFileList.value;

    try {
      const success = await videoUploadApi.postVideo({
        ...form,
        videoId: modifiedVideoId.value ?? undefined,
        introduction: StringUtil.escapeNewline(form.introduction),
      });
      if (success) {
        message.success(isEditMode.value ? "视频修改成功！" : "视频发布成功！");
        submitState.value = true;
      }
    } finally {
      submitting.value = false;
    }
  }

  /* —————— 监听 & 路由守卫 —————— */

  /** 分区选择变更时，实时同步到表单 categoryNumber */
  watch(
    [selectedParentNumber, selectedChildNumber],
    ([parent, child]) => {
      form.categoryNumber = child || parent;
    },
    { immediate: true },
  );

  /** 提交中阻止离开；有未保存数据时弹出二次确认 */
  onBeforeRouteLeave((_to, _from, next) => {
    if (submitting.value) return next(false);

    if (!hasPendingData() || submitState.value) return next();

    confirm({
      message: "离开此页面将丢失当前所有上传数据，确认退出？",
      confirmText: "确认退出",
      confirmFun: () => {
        cleanupAll();
        next();
      },
    });
  });

  /* —————— 生命周期 —————— */

  onMounted(() => {
    initEditVideoFromRoute();
    loadUploadQuota();
  });

  /* —————— 对外输出 —————— */

  return {
    // 表单 & 封面
    form,
    coverBlob,
    tagList,
    closeDanmaku,
    closeComment,
    introductionCharCount,
    // 文件列表
    preuploadList,
    onFileSelected,
    removeItem,
    returnToUploadPanel,
    cleanupAll,
    hasPendingData,
    formatMB: FileUtil.formatMB,
    uploadProgress: UploadUtil.calcProgressPercent,
    // 流程控制
    hasFileSelected,
    submitState,
    submitting,
    formResetKey,
    // 编辑模式
    isEditMode,
    // 衍生计算
    readyUploadFileList,
    hasMissingExistingFileId,
    maxVideoEpisodes,
    hasExceededVideoEpisodes,
    isFormValid,
    // 额度
    remainingVideoQuotaMiB,
    remainingImageQuotaMiB,
    videoQuotaPercent,
    imageQuotaPercent,
    usedVideoQuotaBytes,
    usedImageQuotaBytes,
    setCoverQuotaBytes,
    formatMiB,
    // 分类
    categoryOptions,
    selectedParentNumber,
    selectedChildNumber,
    childCategoryOptions,
    onParentCategoryChange,
    onChildCategoryChange,
    // 提交
    submitVideo,
  };
}
