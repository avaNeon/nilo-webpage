import {
  ref,
  reactive,
  computed,
  nextTick,
  onMounted,
  onBeforeUnmount,
  watch,
} from "vue";
import {
  onBeforeRouteLeave,
  onBeforeRouteUpdate,
  useRoute,
  useRouter,
  type LocationQuery,
} from "vue-router";
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
import { UploadUtil } from "@/shared/utils/UploadUtil";
import { StringUtil } from "@/shared/utils/StringUtil";
import { useVideoUploadEditFlow } from "./useVideoUploadEditFlow";
import { useVideoUploadConfig } from "./useVideoUploadConfig";
import { useCategoryTag } from "./useCategoryTag";
import { useFileValidation } from "./useFileValidation";
import { useSystemConfigStore } from "@/shared/store/SystemConfigStore";
import { useUploadQuota } from "./useUploadQuota";
import { isValidVideoExtension } from "./videoFileTypes";

const LEAVE_CONFIRM_MESSAGE = "离开此页面将丢失当前所有上传数据，确认退出？";
const LEAVE_EDIT_CONFIRM_MESSAGE = "离开此页面将丢失当前所有修改，确认退出？";

export function useVideoUpload() {
  /* —————— 外部依赖 —————— */

  const {
    MAX_TAG_STRING_LENGTH,
    MAX_INTRODUCTION_LENGTH,
    MAX_PART_NAME_LENGTH,
  } = useVideoUploadConfig();

  const {
    categoryOptions,
    selectedParentNumber,
    selectedChildNumber,
    childCategoryOptions,
    onParentCategoryChange: resetChildCategory,
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

  /** VideoTag 组件双向绑定的标签列表，每次增删都同步到 form.tags */
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
    const item = UploadUtil.buildPreuploadFile(
      file,
      `preupload_${Date.now()}_${++uidCounter}`,
    );
    item.filename = item.filename.slice(0, MAX_PART_NAME_LENGTH);
    return item;
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

  /** 拖入 / 选择的一批文件：先按扩展名过滤，再逐个走 onFileSelected 的校验 */
  async function addVideoFiles(files: File[]) {
    for (const file of files) {
      if (submitting.value) return;

      if (!isValidVideoExtension(file.name)) {
        message.warning(`不支持的文件格式: ${file.name}`);
        continue;
      }
      await onFileSelected(file);
    }
  }

  function removeItem(uid: string) {
    if (submitting.value) return;

    const index = preuploadList.value.findIndex(i => i.uid === uid);
    if (index === -1) return;
    // 转码失败文件仅展示，不可删除/提交
    if (isTransferFailedFile(preuploadList.value[index]!)) return;
    preuploadList.value.splice(index, 1);
  }

  /** 离开页面会不会丢东西：新投稿看有没有选文件，编辑稿件看有没有改动 */
  function hasPendingData(): boolean {
    if (isEditMode.value) return hasChanges.value;
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
    editFieldsBaseline.value = null;
    editPartsBaseline.value = null;
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

  /** 投稿成功后「再投一个」：清空表单，去掉编辑用的 query */
  function continueUpload() {
    if (submitting.value) return;

    submitState.value = false;
    cleanupAll();
    router.replace({
      query: { ...route.query, mode: undefined, videoId: undefined },
    });
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

  /* —————— 编辑模式：有没有改动 —————— */

  /** 稿件信息刚加载好时的样子；null 表示还在加载。和当前对比就知道用户改没改 */
  const editFieldsBaseline = ref<string | null>(null);
  const editPartsBaseline = ref<string | null>(null);

  /** 表单里能改的项（封面单独按「是否选了新封面」判断） */
  function fieldsSignature(): string {
    return JSON.stringify([
      form.videoTitle,
      form.postType,
      // 只有转载才有原资源说明，自制时改了它也不算
      form.postType === 2 ? (form.originInfo ?? "").trim() : "",
      form.categoryNumber,
      form.introduction,
      tagList.value.join(","),
      closeDanmaku.value,
      closeComment.value,
    ]);
  }

  /** 分P：旧分P看文件和名称、顺序；新加的分P每个都算一处改动。转码失败的分P不参与 */
  function partsSignature(list: PreuploadVideoFile[]): string {
    return JSON.stringify(
      list
        .filter(item => !isTransferFailedFile(item))
        .map(item =>
          item.isExisting ? ["old", item.fileId, item.filename] : ["new", item.uid],
        ),
    );
  }

  /** 根据路由 query 判断是否进入编辑模式并加载已有视频数据 */
  async function initEditVideo(query: LocationQuery) {
    if (query.mode !== "edit") return;

    const videoId = String(query.videoId ?? "");
    if (!videoId) return;

    modifiedVideoId.value = videoId;
    const isCurrent = () => modifiedVideoId.value === videoId;
    const loaded = await loadEditVideo(videoId, isCurrent, () => {
      // 表单刚填好：等分区、标签的监听同步完，再把现在的样子记成「没改过」
      nextTick(() => {
        if (isCurrent()) editFieldsBaseline.value = fieldsSignature();
      });
    });
    if (loaded) {
      // 加载期间自己加进来的新分P不算「原样」
      editPartsBaseline.value = partsSignature(
        preuploadList.value.filter(item => item.isExisting),
      );
      return;
    }
    // 加载失败按新投稿处理；加载期间已经离开这个稿件的编辑就什么都不动
    if (isCurrent()) {
      modifiedVideoId.value = null;
      editVideoStatus.value = null;
      router.replace({ query: {} });
    }
  }

  /** 选了文件或处于编辑模式时显示分P + 视频信息，否则显示拖拽上传区 */
  const showForm = computed(() => hasFileSelected.value || isEditMode.value);

  /* —————— 衍生计算 —————— */

  /** 转码失败的旧分P（仅展示，不参与编辑/提交） */
  const failedTransferList = computed(() =>
    preuploadList.value.filter(item => isTransferFailedFile(item)),
  );

  /** 可编辑/可计数的分 P（排除转码失败项）；拖拽排序写回时转码失败项始终排在最后 */
  const activePreuploadList = computed<PreuploadVideoFile[]>({
    get: () => preuploadList.value.filter(item => !isTransferFailedFile(item)),
    set: list => {
      preuploadList.value = [...list, ...failedTransferList.value];
    },
  });

  /** 可提交分 P：done 且有 key/fileId，排除转码失败项 */
  const readyUploadFileList = computed(() =>
    activePreuploadList.value
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
    activePreuploadList.value.some(
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
      activePreuploadList.value.length > maxVideoEpisodes.value,
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

  /** 还没填的必填项（提交按钮旁提示「还需完善：…」） */
  const missingFields = computed(() => {
    const missing: string[] = [];
    if (coverBlob.value === null) missing.push("封面");
    if (!form.videoTitle.trim()) missing.push("标题");
    if (!form.categoryNumber) missing.push("分区");
    if (form.postType === 2 && !form.originInfo?.trim()) {
      missing.push("原资源说明");
    }
    return missing;
  });

  /* —————— 上传额度 —————— */

  const {
    videoQuota,
    imageQuota,
    quotaLoading,
    shouldUploadCover,
    loadUploadQuota,
    commitSubmittedQuota,
    hasEnoughVideoQuota,
    setCoverQuotaBytes,
  } = useUploadQuota(preuploadList, coverBlob, submitState);

  /** 编辑稿件时有没有改过东西；新投稿没有「没改过」一说，始终为 true */
  const hasChanges = computed(() => {
    if (!isEditMode.value) return true;
    // 还在加载，没有可比的原样
    if (editFieldsBaseline.value === null || editPartsBaseline.value === null) {
      return false;
    }
    return (
      shouldUploadCover.value ||
      fieldsSignature() !== editFieldsBaseline.value ||
      partsSignature(preuploadList.value) !== editPartsBaseline.value
    );
  });

  const canSubmit = computed(
    () =>
      !submitting.value &&
      hasChanges.value &&
      isFormValid.value &&
      activePreuploadList.value.length > 0 &&
      !hasMissingExistingFileId.value &&
      !videoQuota.value.over &&
      !imageQuota.value.over,
  );

  /** 提交中且正在传视频文件（之后的封面上传、提交表单没有进度） */
  const isUploadingFiles = computed(
    () =>
      submitting.value &&
      preuploadList.value.some(item => item.status === "uploading"),
  );

  /** 整体上传进度：旧分P按已传完计 */
  const uploadPercent = computed(() => {
    const list = activePreuploadList.value;
    const total = list.reduce((sum, item) => sum + item.fileSize, 0);
    if (total <= 0) return 0;
    const sent = list.reduce(
      (sum, item) => sum + Math.min(item.uploadedBytes, item.fileSize),
      0,
    );
    return Math.floor((sent / total) * 100);
  });

  /* —————— 分类 & 互动 —————— */

  /** 将弹幕/评论开关转换为后端 interaction 字段值 */
  function syncInteraction() {
    form.interaction = UploadUtil.buildInteractionValue(
      closeDanmaku.value,
      closeComment.value,
    );
  }

  /** 换了一级分区时清空二级分区 */
  function selectParentCategory(value: string) {
    if (submitting.value || value === selectedParentNumber.value) return;

    selectedParentNumber.value = value;
    resetChildCategory();
  }

  function selectChildCategory(value: string) {
    if (submitting.value) return;

    selectedChildNumber.value = value;
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
    if (activePreuploadList.value.length === 0) {
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
        commitSubmittedQuota();
        submitState.value = true;
      }
    } catch {
      // 请求失败时 request 已经提示过错误
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

  /** 标签增删实时同步到表单（逗号分隔） */
  watch(tagList, tags => {
    form.tags = tags.join(",");
  });

  function leaveMessage(): string {
    return isEditMode.value ? LEAVE_EDIT_CONFIRM_MESSAGE : LEAVE_CONFIRM_MESSAGE;
  }

  /** 提交中阻止离开；有未保存数据时弹出二次确认 */
  onBeforeRouteLeave((_to, _from, next) => {
    if (submitting.value) return next(false);

    if (!hasPendingData() || submitState.value) return next();

    confirm({
      message: leaveMessage(),
      confirmText: "确认退出",
      confirmFun: () => {
        cleanupAll();
        next();
      },
    });
  });

  /**
   * 只改 query 时（如编辑中点侧栏「投稿」）页面组件会复用：
   * 和离开页面一样确认，确认后清空并按新 query 重新初始化。
   */
  onBeforeRouteUpdate((to, from, next) => {
    const sameTarget =
      to.query.mode === from.query.mode &&
      String(to.query.videoId ?? "") === String(from.query.videoId ?? "");
    if (sameTarget) return next();

    if (submitting.value) return next(false);

    const proceed = () => {
      submitState.value = false;
      cleanupAll();
      next();
      initEditVideo(to.query);
    };

    if (!hasPendingData() || submitState.value) return proceed();

    confirm({
      message: leaveMessage(),
      confirmText: "确认退出",
      confirmFun: proceed,
    });
  });

  /** 上传中关闭 / 刷新标签页时让浏览器二次确认 */
  function onBeforeUnload(event: BeforeUnloadEvent) {
    if (!submitting.value) return;
    event.preventDefault();
    event.returnValue = "";
  }

  /* —————— 生命周期 —————— */

  onMounted(() => {
    window.addEventListener("beforeunload", onBeforeUnload);
    loadUploadQuota();
  });

  onBeforeUnmount(() => {
    window.removeEventListener("beforeunload", onBeforeUnload);
  });

  // 表单是同步填好的，放在 setup 里调用，首帧就是编辑状态
  initEditVideo(route.query);

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
    activePreuploadList,
    failedTransferList,
    addVideoFiles,
    removeItem,
    returnToUploadPanel,
    continueUpload,
    // 流程控制
    showForm,
    submitState,
    submitting,
    formResetKey,
    // 编辑模式
    isEditMode,
    hasChanges,
    // 衍生计算
    hasMissingExistingFileId,
    maxVideoEpisodes,
    hasExceededVideoEpisodes,
    missingFields,
    canSubmit,
    isUploadingFiles,
    uploadPercent,
    // 额度
    videoQuota,
    imageQuota,
    quotaLoading,
    setCoverQuotaBytes,
    // 分类
    categoryOptions,
    selectedParentNumber,
    selectedChildNumber,
    childCategoryOptions,
    selectParentCategory,
    selectChildCategory,
    // 提交
    submitVideo,
  };
}
