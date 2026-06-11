/** Represents a video file pending pre-upload to obtain an uploadId */
export interface PreuploadVideoFile {
  /** Unique identifier for vuedraggable item-key */
  uid: string;
  /** Original File object */
  file: File | null;
  /** Editable video filename (display only, without extension) */
  filename: string;
  /** Total file size in bytes */
  fileSize: number;
  /** Size per chunk in bytes */
  chunkSize: number;
  /** Total number of chunks */
  totalChunks: number;
  /** uploadId returned by preUploadVideo; Long on backend, must be string on frontend */
  uploadId: string | null;
  /** Bytes already uploaded */
  uploadedBytes: number;
  /** Upload status */
  status: "pending" | "preuploading" | "uploading" | "done" | "error";
  /** Error message when status is 'error' */
  errorMsg?: string;
  /** Existing file from published video (edit mode) */
  isExisting?: boolean;
  /**
   * 转码状态，仅对已发布视频的旧文件有效：
   * 0 = 转码中, 1 = 转码成功, 2 = 转码失败
   */
  transferResult?: 0 | 1 | 2;
}

/** Represents a single chunk of a video file */
export interface VideoFileChunk {
  /** uploadId identifying which video file this chunk belongs to */
  uploadId: string;
  /** Zero-based chunk index */
  chunkIndex: number;
  /** The actual chunk File content */
  chunkFile: File;
}
