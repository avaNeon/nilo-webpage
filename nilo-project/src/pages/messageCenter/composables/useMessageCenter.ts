import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { MessageCenterApi } from "../api/MessageCenterApi";
import { MessageType, type MessageTypeValue } from "../model/MessageType";
import type { UserMessage } from "../model/UserMessage";
import type { UserMessageCount } from "@/shared/model/UserMessageCount";
import message from "@/shared/lib/message";

export function useMessageCenter() {
  /* ————————数据源———————— */

  const messageTypeBaseItems: Array<{
    label: string;
    value: MessageTypeValue;
  }> = [
    { label: "系统消息", value: MessageType.SYSTEM },
    { label: "点赞消息", value: MessageType.LIKE },
    { label: "收藏消息", value: MessageType.COLLECT },
    { label: "评论消息", value: MessageType.COMMENT },
  ];

  const messages = ref<UserMessage[]>([]);
  const messageTypeUnreadCounts = ref<Record<MessageTypeValue, number | null>>({
    [MessageType.SYSTEM]: null,
    [MessageType.LIKE]: null,
    [MessageType.COLLECT]: null,
    [MessageType.COMMENT]: null,
  });

  /* ————————工具———————— */

  const route = useRoute();
  const router = useRouter();

  /* ————————状态———————— */

  const currentMessageType = computed<MessageTypeValue>(() => {
    const routeType = Number(route.params.type);
    return messageTypeBaseItems.some(item => item.value === routeType)
      ? (routeType as MessageTypeValue)
      : MessageType.SYSTEM;
  });

  const messageTypeItems = computed(() =>
    messageTypeBaseItems.map(item => ({
      ...item,
      count: messageTypeUnreadCounts.value[item.value],
    })),
  );

  const pageNo = ref(1);
  const currentMessageTotalCount = ref<number | null>(null);
  const loading = ref(false);
  const finished = ref(false);
  const deleting = ref(false);
  const checkingAll = ref(false);
  const checkingMessageIds = new Set<string>();
  let requestVersion = 0;

  /* ————————方法———————— */

  function selectMessageType(messageType: MessageTypeValue) {
    if (messageType === currentMessageType.value) return;

    router.push({
      name: "messageCenter",
      params: {
        type: messageType,
      },
    });
  }

  function resetMessages() {
    messages.value = [];
    pageNo.value = 1;
    currentMessageTotalCount.value = null;
    finished.value = false;
    loading.value = false;
  }

  function setUnreadCounts(unreadCount: UserMessageCount | null) {
    messageTypeUnreadCounts.value = {
      [MessageType.SYSTEM]: unreadCount?.systemMessageCount ?? 0,
      [MessageType.LIKE]: unreadCount?.likeMessageCount ?? 0,
      [MessageType.COLLECT]: unreadCount?.collectMessageCount ?? 0,
      [MessageType.COMMENT]: unreadCount?.commentMessageCount ?? 0,
    };
  }

  async function loadUnreadMessageCounts() {
    const unreadCount = await MessageCenterApi.getUncheckedMessageCount();
    setUnreadCounts(unreadCount);
  }

  async function loadCurrentMessageTotalCount() {
    const currentRequestVersion = requestVersion;
    const messageType = currentMessageType.value;
    const count = await MessageCenterApi.getMessageCount(messageType);

    if (
      currentRequestVersion !== requestVersion ||
      messageType !== currentMessageType.value
    ) {
      return;
    }

    currentMessageTotalCount.value = count ?? 0;
  }

  async function loadMessages() {
    if (loading.value || finished.value) return;

    const currentRequestVersion = requestVersion;
    const messageType = currentMessageType.value;
    loading.value = true;

    try {
      const loadedMessages = await MessageCenterApi.getMessages(
        messageType,
        pageNo.value,
      );

      if (
        currentRequestVersion !== requestVersion ||
        messageType !== currentMessageType.value
      ) {
        return;
      }

      if (!loadedMessages || loadedMessages.length === 0) {
        finished.value = true;
        return;
      }

      messages.value.push(...loadedMessages);
      pageNo.value++;
    } finally {
      if (currentRequestVersion === requestVersion) {
        loading.value = false;
      }
    }
  }

  function handleMessagePanelScroll(event: Event) {
    const panel = event.target as HTMLElement;

    if (panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 80) {
      void loadMessages();
    }
  }

  async function deleteMessage(messageId: string) {
    if (deleting.value) return;

    deleting.value = true;
    try {
      const deletingMessage = messages.value.find(
        item => item.messageId === messageId,
      );
      const deleted = await MessageCenterApi.deleteMessage(messageId);

      if (deleted) {
        messages.value = messages.value.filter(
          item => item.messageId !== messageId,
        );
        if (
          currentMessageTotalCount.value !== null &&
          currentMessageTotalCount.value > 0
        ) {
          currentMessageTotalCount.value--;
        }
        const currentUnreadCount =
          messageTypeUnreadCounts.value[currentMessageType.value];
        if (
          deletingMessage?.readType === 0 &&
          currentUnreadCount !== null &&
          currentUnreadCount > 0
        ) {
          messageTypeUnreadCounts.value[currentMessageType.value] =
            currentUnreadCount - 1;
        }
        message.success("消息已删除");
      }
    } finally {
      deleting.value = false;
    }
  }

  function markAllCurrentMessagesAsRead() {
    messageTypeUnreadCounts.value[currentMessageType.value] = 0;
    messages.value = messages.value.map(item => ({
      ...item,
      readType: 1,
    }));
    message.success("已全部标记为已读");
  }

  async function checkAllCurrentMessages() {
    if (checkingAll.value) return;

    const hasUnreadMessage = messages.value.some(item => item.readType === 0);
    // 如果已经没有未读消息，直接标记为已读
    if (!hasUnreadMessage) {
      markAllCurrentMessagesAsRead();
      return;
    }

    // 否则发送请求
    checkingAll.value = true;
    try {
      const checked = await MessageCenterApi.checkAllMessages(
        currentMessageType.value,
      );

      if (checked) {
        markAllCurrentMessagesAsRead();
        void loadUnreadMessageCounts();
      }
    } finally {
      checkingAll.value = false;
    }
  }

  async function checkMessage(readMessage: UserMessage) {
    if (!readMessage.messageId || readMessage.readType !== 0) return;
    if (checkingMessageIds.has(readMessage.messageId)) return;

    checkingMessageIds.add(readMessage.messageId);
    try {
      const checked = await MessageCenterApi.checkMessage(
        readMessage.messageId,
      );

      if (checked) {
        messages.value = messages.value.map(item =>
          item.messageId === readMessage.messageId
            ? {
                ...item,
                readType: 1,
              }
            : item,
        );

        const currentUnreadCount =
          messageTypeUnreadCounts.value[currentMessageType.value];
        if (currentUnreadCount !== null && currentUnreadCount > 0) {
          messageTypeUnreadCounts.value[currentMessageType.value] =
            currentUnreadCount - 1;
        }
      }
    } finally {
      checkingMessageIds.delete(readMessage.messageId);
    }
  }

  /* ————————初始化———————— */

  watch(
    currentMessageType,
    () => {
      requestVersion++;
      resetMessages();
      void loadCurrentMessageTotalCount();
      void loadMessages();
    },
    { immediate: true },
  );

  void loadUnreadMessageCounts();

  return {
    messageTypeItems,
    messages,
    currentMessageType,
    currentMessageTotalCount,
    loading,
    finished,
    deleting,
    checkingAll,
    selectMessageType,
    handleMessagePanelScroll,
    deleteMessage,
    checkAllCurrentMessages,
    checkMessage,
    loadMessages,
  };
}
