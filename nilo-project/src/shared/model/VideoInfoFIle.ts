export interface VideoInfoFile {
  /**
   * upload id (existing file mapping id, optional for backward compatibility)
   */
  uploadId?: string | number;

  /**
   * video file name
   */
  fileName: string;

  /**
   * file index
   */
  fileIndex: number;

  /**
   * duration
   */
  duration: number;
}
