<script setup lang="ts">
import { ElConfigProvider } from 'element-plus'
import { onBeforeMount, provide } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import request from './utils/useRequest'
import { useLoginStateStore } from './store/LoginStateStore'
import message from './utils/useMessage'
import { Api } from './utils/api'
import type { CategoryInfo } from './models/CategoryInfo'
import useCategoryStore from './store/CategoryStore'
import { ServiceType } from './models/ServiceType'

provide('mainContentMaxWidth', 2000)
provide('mainContentMinWidth', 1000)

const loginStateStore = useLoginStateStore()
// 自动登录
async function autoLogin() {
  const result = await request({ method: 'get', url: Api.autoLogin, serviceType: ServiceType.web })
  if (!result?.data) {
    return
  }
  // 保存登录信息
  loginStateStore.setLoginState(true)
  loginStateStore.setUserInfo(result.data)
  loginStateStore.showPanel = false
  message.success(`欢迎回来！ ${result.data.nickName}`)
}
// 分类信息的全局状态管理
const categoryStore = useCategoryStore()
// 获取分类信息
async function loadAllCategories() {
  let result = await request({ method: 'get', url: Api.loadAllCategories, serviceType: ServiceType.admin })
  if (!result?.data) {
    return
  }
  // 非响应式变量
  const categoryList: CategoryInfo[] = result.data
  const categoryMap: Record<string, CategoryInfo> = {}
  result.data.forEach((item: CategoryInfo) => {
    categoryMap[item.categoryNumber] = item
    item.children?.forEach((child: CategoryInfo) => {
      categoryMap[child.categoryNumber] = child
    })
  })
  categoryStore.setCategoryList(categoryList)
  categoryStore.setCategoryMap(categoryMap)
}

onBeforeMount(() => {
  autoLogin()
  loadAllCategories()
})

</script>

<template>
  <el-config-provider :locale="zhCn">
    <RouterView></RouterView>
  </el-config-provider>
</template>

<style lang="scss" scoped></style>
