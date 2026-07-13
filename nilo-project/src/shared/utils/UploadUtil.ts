import type { PreuploadVideoFile } from "@/pages/creativeCenter/features/videoUpload/model/PreuploadVideoFile";
import { StringUtil } from "@/shared/utils/StringUtil";

export interface ExistingUploadFileInput {
  fileName?: string;
  fileSize?: string | number;
  fileId?: string | number | null;
  /** 0:转码中 1:转码成功 2:转码失败 */
  transferResult?: 0 | 1 | 2;
}

export const UploadUtil = {
  calcProgressPercent(item: PreuploadVideoFile): number {
    if (item.fileSize === 0) return 0;
    return Math.round((item.uploadedBytes / item.fileSize) * 100);
  },
  buildInteractionValue(closeDanmaku: boolean, closeComment: boolean): string {
    const parts: string[] = [];
    if (closeDanmaku) parts.push("0");
    if (closeComment) parts.push("1");
    return parts.join(",");
  },
  buildPreuploadFile(file: File, uid: string): PreuploadVideoFile {
    return {
      uid,
      file,
      filename: StringUtil.stripExtension(file.name),
      fileSize: file.size,
      key: null,
      fileId: null,
      uploadedBytes: 0,
      status: "pending",
      isExisting: false,
    };
  },
  buildExistingFile(
    file: ExistingUploadFileInput,
    index: number,
    uid: string,
  ): PreuploadVideoFile {
    const parsedSize =
      typeof file.fileSize === "number"
        ? file.fileSize
        : Number(file.fileSize ?? 0);
    return {
      uid,
      file: null,
      filename: StringUtil.stripExtension(file.fileName || `P${index + 1}`),
      fileSize: Number.isFinite(parsedSize) ? parsedSize : 0,
      key: null,
      fileId:
        file.fileId !== undefined && file.fileId !== null
          ? String(file.fileId)
          : null,
      uploadedBytes: Number.isFinite(parsedSize) ? parsedSize : 0,
      status: "done",
      isExisting: true,
      transferResult: file.transferResult,
    };
  },
  parseTags(tags?: string): string[] {
    return tags
      ? tags
          .split(",")
          .map(tag => tag.trim())
          .filter(Boolean)
      : [];
  },
};
