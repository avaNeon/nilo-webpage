import { defineStore } from "pinia";
import type { SystemConfig } from "../model/SystemConfig";

export const useSystemConfigStore = defineStore("systemConfigStore", {
  state() {
    return {
      videoFileMaxSize: 0,
      videoMaxEpisodes: 0,
      rewardsPreUpload: 0,
      maxSerieVideosNumber: 0,
      maxSeriesNumber: 0,
      maxResolutionRatio: "",
      maxBitRate: 0,
      imageMaxSize: 0,
      dailyVideoUploadSize: 0,
      dailyImageUploadSize: 0,
      modifyNickNameCost: 0,
    } as SystemConfig;
  },
  actions: {
    setVideoMaxSize(size: number) {
      this.videoFileMaxSize = size;
    },
    setVideoMaxEpisodes(episodes: number) {
      this.videoMaxEpisodes = episodes;
    },
    setRewardsPreUpload(rewards: number) {
      this.rewardsPreUpload = rewards;
    },
    setMaxSerieVideosNumber(count: number) {
      this.maxSerieVideosNumber = count;
    },
    setMaxSeriesNumber(count: number) {
      this.maxSeriesNumber = count;
    },
    setMaxResolutionRatio(ratio: string) {
      this.maxResolutionRatio = ratio;
    },
    setMaxBitRate(bitRate: number) {
      this.maxBitRate = bitRate;
    },
    setImageMaxSize(size: number) {
      this.imageMaxSize = size;
    },
    setDailyVideoUploadSize(size: number) {
      this.dailyVideoUploadSize = size;
    },
    setDailyImageUploadSize(size: number) {
      this.dailyImageUploadSize = size;
    },
    setModifyNickNameCost(cost: number) {
      this.modifyNickNameCost = cost;
    },
    /**
     * 批量设置系统配置
     */
    setSystemConfig(config: SystemConfig) {
      this.videoFileMaxSize = config.videoFileMaxSize;
      this.videoMaxEpisodes = config.videoMaxEpisodes;
      this.rewardsPreUpload = config.rewardsPreUpload;
      this.maxSerieVideosNumber = config.maxSerieVideosNumber;
      this.maxSeriesNumber = config.maxSeriesNumber;
      this.maxResolutionRatio = config.maxResolutionRatio;
      this.maxBitRate = config.maxBitRate;
      this.imageMaxSize = config.imageMaxSize;
      this.dailyVideoUploadSize = config.dailyVideoUploadSize;
      this.dailyImageUploadSize = config.dailyImageUploadSize;
      this.modifyNickNameCost = config.modifyNickNameCost;
    },
  },
});
