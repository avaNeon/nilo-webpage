<script setup lang="ts">

import { ElConfigProvider } from 'element-plus'
import { provide } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

provide('mainContentMaxWidth', 2000)
provide('mainContentMinWidth', 1000)

</script>

<template>
  <el-config-provider :locale="zhCn">
    <RouterView></RouterView>
  </el-config-provider>
</template>

<style lang="scss" scoped></style>
