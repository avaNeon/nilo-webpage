/** 存档视频分 P 文件信息（对齐后端 VideoInfoFileArchive） */
export interface VideoInfoFileArchive {
  /** 唯一ID */
  fileId: string;

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

  /** HLS plain key（baseKey） */
  filePath: string;

  /** 持续时间（秒） */
  duration: number;
}
