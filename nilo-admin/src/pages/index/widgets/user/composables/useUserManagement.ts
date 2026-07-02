import { onMounted, ref, watch } from "vue";
import { UserApi } from "@/pages/index/widgets/user/api/UserApi";
import type { UserInfo } from "@/pages/index/widgets/user/model/UserInfo";
import type { UserInfoQuery } from "@/pages/index/widgets/user/model/UserInfoQuery";

/** 用户管理页数据、筛选与分页逻辑 */
export function useUserManagement() {
  /* —————— 筛选条件 —————— */

  /** 昵称模糊搜索关键字 */
  const nickNameKeyword = ref("");

  /** 邮箱模糊搜索关键字 */
  const emailKeyword = ref("");

  /**
   * 账户状态筛选值
   * - `undefined` → 不筛选（全部）
   * - `1`        → 仅正常账户
   * - `0`        → 仅禁用账户
   */
  const selectedStatus = ref<number | undefined>(undefined);

  /** 账户状态下拉选项 */
  const statusOptions = [
    { label: "正常", value: 1 },
    { label: "禁用", value: 0 },
  ] as const;

  /* —————— 列表与分页 —————— */

  /** 符合筛选条件的用户总数 */
  const userCount = ref(0);

  /** 当前页用户列表 */
  const userList = ref<UserInfo[]>([]);

  /** 当前页号（从 1 开始） */
  const currentPage = ref(1);

  /** 每页条数 */
  const pageSize = ref(10);

  /** 列表加载中 */
  const loading = ref(false);

  /**
   * 构建筛选查询参数（不含分页）
   * 空关键字与未选状态不会传给后端
   */
  function buildFilterQuery(): Omit<UserInfoQuery, "pageNo" | "pageSize"> {
    const query: Omit<UserInfoQuery, "pageNo" | "pageSize"> = {};

    const nickName = nickNameKeyword.value.trim();
    if (nickName) query.nickNameFuzzy = nickName;

    const email = emailKeyword.value.trim();
    if (email) query.emailFuzzy = email;

    if (selectedStatus.value !== undefined) {
      query.status = selectedStatus.value;
    }

    return query;
  }

  /** 构建带分页的列表查询参数 */
  function buildListQuery(): UserInfoQuery {
    return {
      ...buildFilterQuery(),
      pageNo: currentPage.value,
      pageSize: pageSize.value,
    };
  }

  async function loadUserCount() {
    const result = await UserApi.getUserInfoCount(buildFilterQuery());
    if (result !== null) {
      userCount.value = result;
    }
  }

  async function loadUserList() {
    loading.value = true;
    try {
      const result = await UserApi.loadUserInfoList(buildListQuery());
      userList.value = result ?? [];
    } finally {
      loading.value = false;
    }
  }

  /** 同时刷新列表与总数 */
  async function loadData() {
    await Promise.all([loadUserCount(), loadUserList()]);
  }

  function handleSearch() {
    currentPage.value = 1;
    loadData();
  }

  function handlePageNoChange(pageNo: number) {
    currentPage.value = pageNo;
    loadUserList();
  }

  function handlePageSizeChange(size: number) {
    pageSize.value = size;
    currentPage.value = 1;
    loadUserList();
  }

  /** 状态切换成功后同步更新本地行数据，避免整表重载 */
  function handleUserStatusChanged(userId: string, status: number) {
    const user = userList.value.find(item => item.userId === userId);
    if (user) {
      user.status = status;
    }
  }

  // 状态筛选变更后立即查询
  watch(selectedStatus, () => {
    currentPage.value = 1;
    loadData();
  });

  // 昵称 / 邮箱输入防抖：1s 后自动搜索
  let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  watch([nickNameKeyword, emailKeyword], () => {
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      currentPage.value = 1;
      loadData();
    }, 1000);
  });

  onMounted(() => {
    loadData();
  });

  return {
    nickNameKeyword,
    emailKeyword,
    selectedStatus,
    statusOptions,
    userCount,
    userList,
    currentPage,
    pageSize,
    loading,
    handleSearch,
    handlePageNoChange,
    handlePageSizeChange,
    handleUserStatusChanged,
  };
}
