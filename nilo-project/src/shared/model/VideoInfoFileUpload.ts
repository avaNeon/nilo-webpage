export interface VideoInfoFileUpload {
  uploadId: string;
  fileName: string;
  fileIndex: number,
  fileSize: string;
  /**
   * 0:转码中 1:转码成功 2:转码失败
   */
  transferResult?: 0 | 1 | 2;
}
