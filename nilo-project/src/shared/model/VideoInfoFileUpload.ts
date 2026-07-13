export interface VideoInfoFileUpload {
  /** 已有文件 id；不可复用时为 null */
  fileId: string | null;
  fileName: string;
  fileIndex: number;
  fileSize: string;
  /**
   * 0 转码中
   * 1 成功
   * 2 失败
   */
  transferResult?: 0 | 1 | 2;
}
