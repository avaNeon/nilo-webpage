/** 视频文件上传项（uploadId + 用户自定义文件名） */
export interface VideoFileUploadItem {
  /** uploadId（临时文件映射ID；Long → string） */
  uploadId: string;
  /** 用户自定义文件名 */
  filename: string;
}

/** 视频上传/修改信息（前端类型，Long 值一律使用 string 避免精度丢失） */
export interface VideoUpload {
  /** 视频的唯一ID（修改时必填，新增时留空；Long → string） */
  videoId?: string;

  /** 封面在服务器的相对地址 */
  coverPath: string;

  /** 视频标题 */
  videoTitle: string;

  /** 所属分类编号 */
  categoryNumber: string;

  /** 投稿类型（1:自制 2:转载） */
  postType: number;

  /** 标签（多个标签用逗号分隔） */
  tags?: string;

  /** 视频简介 */
  introduction?: string;

  /** 原资源说明（转载时填写） */
  originInfo?: string;

  /** 互动设置（如 "1":关闭弹幕 "2":关闭评论，多个用逗号分隔） */
  interaction: string;

  /** 视频文件列表（uploadId + 用户自定义filename） */
  videoFileUploadList: VideoFileUploadItem[];
}
