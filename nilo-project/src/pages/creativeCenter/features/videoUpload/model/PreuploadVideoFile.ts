/** 待上传或编辑中的分 P 文件 */
export interface PreuploadVideoFile {
  /** 列表项唯一 id（拖拽用） */
  uid: string;
  /** 本地 File；已有分 P 为 null */
  file: File | null;
  /** 展示用文件名（无扩展名） */
  filename: string;
  /** 文件大小（字节） */
  fileSize: number;
  /** 上传成功后的 plain key（无 tmp/）；与 fileId 二选一 */
  key: string | null;
  /** 编辑时保留的旧文件 id；与 key 二选一 */
  fileId: string | null;
  /** 已上传字节数 */
  uploadedBytes: number;
  /** 上传状态 */
  status: "pending" | "uploading" | "done" | "error";
  /** 错误信息 */
  errorMsg?: string;
  /** 是否为编辑加载的旧分 P */
  isExisting?: boolean;
  /** 转码状态：0 转码中 / 1 成功 / 2 失败（仅旧文件） */
  transferResult?: 0 | 1 | 2;
}

/** 旧分 P 且转码失败：不可编辑、不可提交 */
export function isTransferFailedFile(item: PreuploadVideoFile): boolean {
  return Boolean(item.isExisting && Number(item.transferResult) === 2);
}
