<script setup lang="ts">
import { ElConfigProvider } from 'element-plus'
import { onBeforeMount, provide } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { useAutoLogin } from '@/app/composables/useAutoLogin'
import { useInitCategories } from '@/app/composables/useInitCategories'
import { useInitSystemConfig } from '@/app/composables/useInitSystemConfig'
import { useAccount } from '@/shared/composables/useAccount'

provide('mainContentMaxWidth', 2000)
provide('mainContentMinWidth', 1440)

const { autoLogin } = useAutoLogin()
const { loadAllCategories } = useInitCategories()
const { loadSystemConfig } = useInitSystemConfig()
const { saveUserState } = useAccount()

onBeforeMount(() =>
{
  autoLogin()
  loadAllCategories()
  loadSystemConfig()
  // may take more time
  saveUserState()
})

</script>

<template>
  <el-config-provider :locale="zhCn">
    <RouterView></RouterView>
  </el-config-provider>
</template>

<style lang="scss" scoped></style>
