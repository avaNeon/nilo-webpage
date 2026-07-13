import type { Ref } from "vue";
import type { VideoInfo } from "@/shared/model/VideoInfo";
import type { VideoInfoFileUpload } from "@/shared/model/VideoInfoFileUpload";
import type { PreuploadVideoFile } from "./PreuploadVideoFile";
import type { VideoUpload } from "./VideoUpload";
import { videoFileApi } from "@/shared/api/VideoFileApi";
import message from "@/shared/lib/message";
import useVideoUploadEditStore from "@/shared/store/VideoUploadEditStore";
import { StringUtil } from "@/shared/utils/StringUtil";
import { UploadUtil } from "@/shared/utils/UploadUtil";

/** 与后端 VideoStatus.TRANSCODING_FAIL 一致 */
const VIDEO_STATUS_TRANSCODING_FAILED = 1;

function applyDetailToForm(form: VideoUpload, detail: VideoInfo) {
  form.videoTitle = detail.videoName ?? "";
  form.postType = Number(detail.postType ?? 1);
  form.originInfo = detail.originInfo ?? "";
  form.categoryNumber = detail.categoryNumber ?? "";
  form.introduction = StringUtil.unescapeNewline(detail.introduction);
  form.interaction = detail.interaction ?? "";
  form.tags = Array.isArray(detail.tags) ? detail.tags.join(",") : "";
  form.coverPath = detail.videoCover ?? "";
}

function syncInteractionFlags(
  interaction: string,
  closeDanmaku: Ref<boolean>,
  closeComment: Ref<boolean>,
) {
  const interactionSet = new Set(
    interaction
      .split(",")
      .map(value => value.trim())
      .filter(Boolean),
  );
  closeDanmaku.value = interactionSet.has("0");
  closeComment.value = interactionSet.has("1");
}

function buildExistingFileList(
  fileList: VideoInfoFileUpload[],
  videoStatus?: number | null,
): PreuploadVideoFile[] {
  const isVideoTranscodingFailed =
    Number(videoStatus) === VIDEO_STATUS_TRANSCODING_FAILED;

  return [...fileList]
    .sort((a, b) => Number(a.fileIndex) - Number(b.fileIndex))
    .map((item, index) => {
      const built = UploadUtil.buildExistingFile(
        item,
        index,
        `existing_${Date.now()}_${index}`,
      );

      // 视频为转码失败时：后端会清空失败文件 fileId；统一标为不可复用
      const transferFailed =
        Number(built.transferResult) === 2 ||
        (isVideoTranscodingFailed && built.fileId === null);

      if (transferFailed) {
        built.transferResult = 2;
        built.fileId = null;
      }

      return built;
    });
}

export function useVideoUploadEditFlow(
  form: VideoUpload,
  preuploadList: Ref<PreuploadVideoFile[]>,
  hasFileSelected: Ref<boolean>,
  closeDanmaku: Ref<boolean>,
  closeComment: Ref<boolean>,
  initialTags: Ref<string[]>,
  syncCategorySelectionByCategoryNumber: (categoryNumber: string) => void,
  editVideoStatus: Ref<number | null>,
) {
  /** 编辑中的视频信息暂存 */
  const videoUploadEditStore = useVideoUploadEditStore();

  async function loadEditVideo(videoId: string): Promise<boolean> {
    const detail = videoUploadEditStore.editVideoInfo;
    if (!detail || String(detail.videoId ?? "") !== videoId) {
      message.error("加载视频信息失败");
      return false;
    }

    editVideoStatus.value =
      detail.status === null || detail.status === undefined
        ? null
        : Number(detail.status);

    applyDetailToForm(form, detail);
    syncCategorySelectionByCategoryNumber(form.categoryNumber);
    initialTags.value = UploadUtil.parseTags(form.tags);
    syncInteractionFlags(form.interaction, closeDanmaku, closeComment);

    const fileList = await videoFileApi.loadVideoFileUpload(videoId);
    hasFileSelected.value = true;
    preuploadList.value = fileList?.length
      ? buildExistingFileList(fileList, detail.status)
      : [];

    videoUploadEditStore.clearEditVideoInfo();
    return true;
  }

  return {
    loadEditVideo,
  };
}
