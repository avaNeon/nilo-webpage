<script lang="ts" setup>
import { ref, watch } from "vue";
import { imgRequestUrl, resolveImageUrl } from "@/shared/utils/ImgUtil";

/** pending 用预签名，否则用公开 MinIO */

const props = withDefaults(
  defineProps<{
    path: string | null | undefined;
    /** true 预签名；false 公开 MinIO */
    pending?: boolean;
    /** 列表优先缩略图 */
    thumb?: boolean;
    fit?: "fill" | "contain" | "cover" | "none" | "scale-down";
    className?: string;
  }>(),
  {
    pending: false,
    thumb: true,
    fit: "cover",
    className: "",
  },
);

const src = ref("");

watch(
  () => [props.path, props.pending, props.thumb] as const,
  async ([path, pending, thumb]) =>
  {
    if (!path)
    {
      src.value = "";
      return;
    }
    if (pending)
    {
      // 存档/未过审只走 pending 预签名，失败也不回退 public
      src.value = await resolveImageUrl(path, thumb);
    } else
    {
      src.value = imgRequestUrl(path, thumb);
    }
  },
  { immediate: true },
);
</script>

<template>
  <el-image :src="src" :fit="fit" :class="className">
    <template #error>
      <slot name="error" />
    </template>
  </el-image>
</template>
