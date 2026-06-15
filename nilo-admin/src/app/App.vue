<script setup lang="ts">
import { onMounted } from 'vue';
import { useAutoLogin } from './composables/useAutoLogin';
import { useRouter } from 'vue-router';

const router = useRouter()
const { autoLogin } = useAutoLogin()

onMounted(async () =>
{
  const result = await autoLogin()
  if (!result)
  {
    router.push('/login')
  }
})
</script>

<template>
  <div class="window">
    <RouterView />
  </div>
</template>

<style lang="scss" scoped>
.window {
  min-height: 100vh;
}
</style>