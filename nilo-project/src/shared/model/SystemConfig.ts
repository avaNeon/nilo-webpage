export interface SystemConfig {
  /**
   * max of video size，unit:MB
   */
  videoFileMaxSize: number;
  /**
   * max image size，unit:MB
   */
  imageMaxSize: number;
  /**
   * per user daily video upload quota，unit：MB
   */
  dailyVideoUploadSize: number;
  /**
   * per user daily image upload quota，unit：MB
   */
  dailyImageUploadSize: number;

  /**
   * max resolution ratio support
   */
  maxResolutionRatio: string;
  /**
   * max bit rate support，unit:fps
   */
  maxBitRate: number;

  /**
   * max partition numver per video
   */
  videoMaxEpisodes: number;
  /**
   * max video count per series
   */
  maxSerieVideosNumber: number;
  /**
   * max series number
   */
  maxSeriesNumber: number;

  /**
   * coin bonus for per uploaded video
   */
  rewardsPreUpload: number;
  /**
   * coin cost for changing nickname
   */
  modifyNickNameCost: number;
}
