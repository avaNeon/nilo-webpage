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
  chunkSize: number,
): PreuploadVideoFile[] {
  return [...fileList]
    .sort((a, b) => Number(a.fileIndex) - Number(b.fileIndex))
    .map((item, index) =>
      UploadUtil.buildExistingFile(
        item,
        index,
        chunkSize,
        `existing_${Date.now()}_${index}`,
      ),
    );
}

export function useVideoUploadEditFlow(
  form: VideoUpload,
  preuploadList: Ref<PreuploadVideoFile[]>,
  hasFileSelected: Ref<boolean>,
  closeDanmaku: Ref<boolean>,
  closeComment: Ref<boolean>,
  initialTags: Ref<string[]>,
  syncCategorySelectionByCategoryNumber: (categoryNumber: string) => void,
  chunkSize: number,
) {
  /** temporarily store the uploading video info */
  const videoUploadEditStore = useVideoUploadEditStore();

  async function loadEditVideo(videoId: string): Promise<boolean> {
    const detail = videoUploadEditStore.editVideoInfo;
    if (!detail || String(detail.videoId ?? "") !== videoId) {
      message.error("加载视频信息失败");
      return false;
    }

    applyDetailToForm(form, detail);
    syncCategorySelectionByCategoryNumber(form.categoryNumber);
    initialTags.value = UploadUtil.parseTags(form.tags);
    syncInteractionFlags(form.interaction, closeDanmaku, closeComment);

    const fileList = await videoFileApi.loadVideoFileUpload(videoId);
    hasFileSelected.value = true;
    preuploadList.value = fileList?.length
      ? buildExistingFileList(fileList, chunkSize)
      : [];

    videoUploadEditStore.clearEditVideoInfo();
    return true;
  }

  return {
    loadEditVideo,
  };
}
