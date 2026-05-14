import { Api } from "@/shared/config/Api";
import request from "@/shared/lib/request";
import type { VideoInfoFile } from "@/shared/model/VideoInfoFIle";
import type { VideoInfoFileUpload } from "../model/VideoInfoFileUpload";

export const videoFileApi = {
  async loadVideoFileList(videoId: string): Promise<VideoInfoFile[] | null> {
    const result = await request({
      method: "get",
      url: `${Api.loadVideoFileList}/${videoId}`,
    });
    if (!result) return null;
    return (result.data ?? []) as VideoInfoFile[];
  },

  async loadVideoFileUpload(
    videoId: string,
  ): Promise<VideoInfoFileUpload[] | null> {
    const result = await request({
      method: "get",
      url: `${Api.ccLoadVideoInfoFileUploadList}/${videoId}`,
    });
    if (!result) return null;
    return (result.data ?? []) as VideoInfoFileUpload[];
  },
};
