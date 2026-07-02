/** 视频分P文件信息 */
export interface VideoInfoFileUpload {
  /** 唯一ID */
  fileId: string;

  /** 上传ID */
  uploadId: string;

  /** 用户ID */
  userId: string;

  /** 视频ID */
  videoId: string;

  /** 文件索引 */
  fileIndex: number;

  /** 文件名 */
  fileName: string;

  /** 文件大小 */
  fileSize: string;

  /** 文件路径（只保存相对路径） */
  filePath: string;

  /** 0:无更新 1:有更新 */
  updateType: number;

  /** 0:转码中 1:转码成功 2:转码失败 */
  transferResult: number;

  /** 持续时间（秒） */
  duration: number;
}
