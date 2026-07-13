/** 分 P 提交项：新上传用 key，保留旧分 P 用 fileId（二选一） */
export interface VideoFileUploadItem {
  /** 新上传的 plain key（无 tmp/） */
  key?: string;
  /** 编辑时保留的旧文件 id */
  fileId?: string;
  /** 自定义文件名 */
  filename: string;
}

/** 投稿/修改视频表单（Long 用 string 防精度丢失） */
export interface VideoUpload {
  /** 视频 id（修改必填） */
  videoId?: string;

  /** 封面 plain key */
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

  /** 分 P 列表 */
  videoFileUploadList: VideoFileUploadItem[];
}
