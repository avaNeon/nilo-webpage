import { UserHomeSharedApi } from "@/pages/userHome/shared/api/UserHomeSharedApi";
import type { FollowUserInfo } from "@/pages/userHome/shared/model/FollowUserInfo";
import { onMounted, ref } from "vue";

export function useUserHomeFollowerList() {
  /* ——————状态—————— */

  const pageNo = ref(1);
  const pageSize = ref(10);
  const userList = ref<FollowUserInfo[]>([]);
  const loading = ref(false);
  const noMore = ref(false);

  /* ——————方法—————— */

  /** 加载粉丝列表 */
  async function loadFollowerList(newPageNo: number) {
    if (loading.value) return;

    pageNo.value = newPageNo;
    loading.value = true;

    const result = await UserHomeSharedApi.getFollowerList(
      pageNo.value,
      pageSize.value,
    );

    loading.value = false;

    if (result === false) {
      // 请求失败
      return;
    }

    if (result === null || result.length === 0) {
      noMore.value = true;
      return;
    }

    if (newPageNo === 1) {
      userList.value = result;
    } else {
      userList.value.push(...result);
    }

    if (result.length < pageSize.value) {
      noMore.value = true;
    }
  }

  /** 加载下一页 */
  async function loadMore() {
    if (noMore.value || loading.value) return;
    await loadFollowerList(pageNo.value + 1);
  }

  /* ——————初始化—————— */

  onMounted(() => {
    loadFollowerList(1);
  });

  return {
    pageNo,
    pageSize,
    userList,
    loading,
    noMore,
    loadFollowerList,
    loadMore,
  };
}
