import { Api } from "@/shared/config/Api";
import request from "@/shared/lib/request";
import type { UserMessage } from "@/pages/messageCenter/model/UserMessage";
import type { MessageTypeValue } from "@/pages/messageCenter/model/MessageType";
import { MessageApi } from "@/shared/api/MessageApi";

export const MessageCenterApi = {
  /**
   * 获取用户未读信息数量
   */
  async getUncheckedMessageCount() {
    return MessageApi.getUncheckedMessageCount();
  },

  /**
   * 将一个分类的未读消息都标记为已读
   *
   * @param messageType 消息类型（1:系统 2:点赞 3:收藏 4:评论）
   */
  async checkAllMessages(messageType: MessageTypeValue): Promise<boolean> {
    const result = await request({
      method: "post",
      url: Api.messageClear + "/" + messageType,
    });
    if (!result) {
      return false;
    }
    return true;
  },

  /**
   * 将单条消息标记为已读
   *
   * @param messageId 消息ID
   */
  async checkMessage(messageId: string): Promise<boolean> {
    const result = await request({
      method: "post",
      url: Api.messageCheck + messageId,
    });
    if (!result) {
      return false;
    }
    return true;
  },

  /**
   * 获取单个分类的消息数量
   *
   * @param messageType 消息类型（1:系统 2:点赞 3:收藏 4:评论）
   */
  async getMessageCount(messageType: MessageTypeValue): Promise<number | null> {
    const result = await request({
      method: "get",
      url: Api.messageCount + messageType,
    });
    if (!result) {
      return null;
    }
    return result.data as number;
  },

  /**
   * 分页获取单个分类的消息
   *
   * @param messageType 消息类型（1:系统 2:点赞 3:收藏 4:评论）
   * @param pageNo      页号（从1开始）
   */
  async getMessages(
    messageType: MessageTypeValue,
    pageNo: number,
  ): Promise<UserMessage[] | null> {
    const result = await request({
      method: "get",
      url: Api.messageList + messageType + "/" + pageNo,
    });
    if (!result) {
      return null;
    }
    return result.data as UserMessage[];
  },

  /**
   * 删除一条消息
   *
   * @param messageId 消息ID
   */
  async deleteMessage(messageId: string): Promise<boolean> {
    const result = await request({
      method: "delete",
      url: Api.messageDelete + messageId,
    });
    if (!result) {
      return false;
    }
    return true;
  },
};
