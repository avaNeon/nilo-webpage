/** 视频分P文件信息 */
export interface VideoInfoFileUpload {
  /** 唯一ID；审核失败等不可复用时可能为 null */
  fileId: string | null;

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

  /** 已发布 HLS 的 plain key */
  filePath: string;

  /** 0:无更新 1:有更新 */
  updateType: number;

  /** 0:转码中 1:转码成功 2:转码失败 */
  transferResult: number;

  /** 持续时间（秒） */
  duration: number;
}
