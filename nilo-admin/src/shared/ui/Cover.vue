<script lang="ts" setup>
import { computed } from "vue";

const THUMBNAIL_SUFFIX = "_thumb";

const props = withDefaults(
  defineProps<{
    src: string;
    width: number;
    lazy?: boolean;
    fit?: "fill" | "contain" | "cover" | "none" | "scale-down";
    preview?: boolean;
    borderRadius?: number | string;
    scale?: number;
    autoHeight?: boolean;
    thumbnail?: boolean;
  }>(),
  {
    lazy: true,
    fit: "scale-down",
    preview: false,
    borderRadius: 5,
    scale: 1,
    autoHeight: false,
    thumbnail: false,
  },
);

/** thumbnail 时在路径扩展名前插 `_thumb`（保留 query/hash） */
const displaySrc = computed(() => {
  if (!props.src) return "";
  if (!props.thumbnail) return props.src;
  if (props.src.includes(THUMBNAIL_SUFFIX)) return props.src;
  const q = props.src.indexOf("?");
  const h = props.src.indexOf("#");
  let end = props.src.length;
  if (q >= 0) end = Math.min(end, q);
  if (h >= 0) end = Math.min(end, h);
  const path = props.src.slice(0, end);
  const suffix = props.src.slice(end);
  return path.replace(/\.\w+$/, ext => THUMBNAIL_SUFFIX + ext) + suffix;
});

/** 预览用原图 */
const previewList = computed(() => {
  if (!props.preview || !props.src) return [];
  return [props.src.replace(THUMBNAIL_SUFFIX, "")];
});
</script>

<template>
  <div
    class="image-container"
    :class="{ 'auto-height': autoHeight }"
    :style="{
      borderRadius: typeof borderRadius === 'number' ? borderRadius + 'px' : borderRadius,
      width: width + 'px',
      height: autoHeight ? 'auto' : width * scale + 'px',
      maxWidth: width + 'px',
      maxHeight: autoHeight ? 'none' : width * scale + 'px',
    }"
  >
    <el-image
      v-if="displaySrc"
      :lazy="lazy"
      :src="displaySrc"
      :fit="fit"
      :preview-src-list="previewList"
      :preview-teleported="true"
      :style="{
        borderRadius: typeof borderRadius === 'number' ? borderRadius + 'px' : borderRadius,
        width: '100%',
        height: '100%',
      }"
    />
  </div>
</template>

<style lang="scss" scoped>
.image-container {
  overflow: hidden;
  cursor: pointer;
  background: #f8f8f8;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

:deep(.el-image) {
  width: 100%;
  height: 100%;
  border-radius: inherit;
}

:deep(img),
:deep(.el-image__inner) {
  width: 100%;
  height: 100%;
  display: block;
}

.auto-height {
  :deep(img),
  :deep(.el-image__inner) {
    height: auto;
  }
}
</style>
