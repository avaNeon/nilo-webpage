export const MediaUtil = {
  getVideoDuration(file: File): Promise<number> {
    return new Promise(resolve => {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(video.duration || 0);
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(0);
      };

      video.src = url;
    });
  },
};
