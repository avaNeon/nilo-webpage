export interface VideoInfoFile {
  /** 已发布 HLS 的 plain base key（无前缀） */
  filePath: string;
  /** 分 P 文件名 */
  fileName: string;
  /** 分 P 序号 */
  fileIndex: number;
  /** 时长（秒） */
  duration: number;
}
