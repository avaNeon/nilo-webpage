/** 系统配置（对应后端 SystemConfig） */
export interface SystemConfig {
  /** 单个视频文件大小上限，单位：MB */
  videoFileMaxSize: number;

  /** 单个图片文件大小上限，单位：MB */
  imageMaxSize: number;

  /** 每日用户上传视频大小限额，单位：MB */
  dailyVideoUploadSize: number;

  /** 每日用户上传图片大小限额，单位：MB */
  dailyImageUploadSize: number;

  /** 最大分辨率支持 */
  maxResolutionRatio: string;

  /** 最大码率支持，单位：fps */
  maxBitRate: number;

  /** 单个视频最大分P数 */
  videoMaxEpisodes: number;

  /** 最大系列视频数量 */
  maxSerieVideosNumber: number;

  /** 最大系列数量 */
  maxSeriesNumber: number;

  /** 注册用户初始赠送硬币数 */
  registerCoin: number;

  /** 每个上传的视频奖励硬币数 */
  rewardsPreUpload: number;

  /** 修改昵称硬币花费 */
  modifyNickNameCost: number;
}

/** 与后端默认值保持一致 */
export function createDefaultSystemConfig(): SystemConfig {
  return {
    videoFileMaxSize: 100,
    imageMaxSize: 10,
    dailyVideoUploadSize: 100,
    dailyImageUploadSize: 50,
    maxResolutionRatio: "1280×720",
    maxBitRate: 60,
    videoMaxEpisodes: 100,
    maxSerieVideosNumber: 100,
    maxSeriesNumber: 100,
    registerCoin: 10,
    rewardsPreUpload: 10,
    modifyNickNameCost: 1,
  };
}
