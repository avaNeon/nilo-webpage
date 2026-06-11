export interface SystemConfig {
  /**
   * max of video size，unit:MB
   */
  videoFileMaxSize: number;
  /**
   * max partition numver per video
   */
  videoMaxEpisodes: number;
  /**
   * initial coin number for new user
   */
  registerCoin: number;
  /**
   * coin bonus for per uploaded video
   */
  rewardsPreUpload: number;
  /**
   * max video count per series
   */
  maxSerieVideosNumber: number;
  /**
   * max resolution ratio support
   */
  maxResolutionRatio: string;
  /**
   * max bit rate support，unit:fps
   */
  maxBitRate: number;
  /**
   * max image size，unit:MB
   */
  imageMaxSize: number;
  /**
   * coin cost for changing nickname
   */
  modifyNickNameCost: number;
}
