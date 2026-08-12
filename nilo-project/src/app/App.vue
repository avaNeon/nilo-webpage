<script setup lang="ts">
import { ElConfigProvider } from 'element-plus'
import { onBeforeMount, provide } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { useInitCategories } from '@/app/composables/useInitCategories'
import { useInitSystemConfig } from '@/app/composables/useInitSystemConfig'
import Account from '@/shared/features/account/ui/Account.vue'

provide('mainContentMaxWidth', 2000)
provide('mainContentMinWidth', 1440)

const { loadAllCategories } = useInitCategories()
const { loadSystemConfig } = useInitSystemConfig()

onBeforeMount(() =>
{
  loadAllCategories()
  loadSystemConfig()
})

</script>

<template>
  <el-config-provider :locale="zhCn">
    <RouterView></RouterView>
    <Account />
  </el-config-provider>
</template>

<style lang="scss" scoped>

</style>
