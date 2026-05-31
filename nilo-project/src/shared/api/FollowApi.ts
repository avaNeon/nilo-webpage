import request from "@/shared/lib/request";
import { Api } from "@/shared/config/Api";

export const FollowApi = {
  /**
   * 关注/取消关注
   * @param followingUserId 被关注用户ID（路径参数）
   */
  async follow(followingUserId: string) {
    await request({
      method: "post",
      url: Api.follow + "/" + followingUserId,
    });
  },
//   /**
//    * 获取指定用户的粉丝数
//    * @param userId 用户ID
//    * @returns 粉丝数
//    */
//   async getFollowerCount(userId: string) {
//     const result = await request({
//       method: "get",
//       url: Api.getFollowerCount + "/" + userId,
//     });
//     if (!result) {
//       return 0;
//     } else {
//       return result.data;
//     }
//   },
} as const;
