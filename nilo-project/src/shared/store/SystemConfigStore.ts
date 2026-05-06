import { defineStore } from "pinia";
import type { SystemConfig } from "../model/SystemConfig";

export const useSystemConfigStore = defineStore("systemConfigStore", {
  state() {
    return {
      videoFileMaxSize: 0,
      videoMaxEpisodes: 0,
      registerCoin: 0,
      rewardsPreUpload: 0,
      maxPartitionDuration: 0,
      maxResolutionRatio: "",
      maxBitRate: 0,
    } as SystemConfig;
  },
  actions: {
    setVideoMaxSize(size: number) {
      this.videoFileMaxSize = size;
    },
    setVideoMaxEpisodes(episodes: number) {
      this.videoMaxEpisodes = episodes;
    },
    setRegisterCoin(coin: number) {
      this.registerCoin = coin;
    },
    setRewardsPreUpload(rewards: number) {
      this.rewardsPreUpload = rewards;
    },
    setMaxPartitionDuration(duration: number) {
      this.maxPartitionDuration = duration;
    },
    setMaxResolutionRatio(ratio: string) {
      this.maxResolutionRatio = ratio;
    },
    setMaxBitRate(bitRate: number) {
      this.maxBitRate = bitRate;
    },
    /**
     * 批量设置系统配置
     */
    setSystemConfig(config: SystemConfig) {
      this.videoFileMaxSize = config.videoFileMaxSize;
      this.videoMaxEpisodes = config.videoMaxEpisodes;
      this.registerCoin = config.registerCoin;
      this.rewardsPreUpload = config.rewardsPreUpload;
      this.maxPartitionDuration = config.maxPartitionDuration;
      this.maxResolutionRatio = config.maxResolutionRatio;
      this.maxBitRate = config.maxBitRate;
    },
  },
});
