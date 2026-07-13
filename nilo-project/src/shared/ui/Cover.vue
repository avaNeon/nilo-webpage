<script lang="ts" setup>
import { computed, ref } from 'vue';
import { THUMBNAIL_SUFFIX } from '@/shared/config/Config';

const props = withDefaults(defineProps<{
    src: string,                // 图片原链接
    width: number              // 图片宽度（像素），高度会根据 scale 计算
    lazy?: boolean,             // 是否开启懒加载，默认 true
    fit?: "fill" | "contain" | "cover" | "none" | "scale-down" // 图片缩放模式，同 el-image
    preview?: boolean,          // 是否开启大图预览
    notFound?: string,          // 图片 404 时的占位图路径
    borderRadius?: number | string, // 圆角值，传数字单位为 px，传字符串原样应用
    scale?: number,             // 高宽比（高度 = 宽度 * scale），默认 1.0 (正方形)
    defaultSrc?: string,         // src 为空或加载失败时的兜底默认图
    border?: string,            // 图片边框样式，例如 "2px solid red"
    autoHeight?: boolean,
    thumbnail?: boolean,        // 是否启用缩略图派生（只有预览时显示原图），默认 false
}>(), {
    lazy: true,
    fit: 'scale-down',
    preview: false,
    notFound: '../../assets/img/404.png',
    borderRadius: 5,
    scale: 1,
    defaultSrc: '../../assets/unknown.png',
    border: 'none',
    autoHeight: false,
    thumbnail: false,
})
// 
const showViewer = ref(false)
// 加载图片的高度，与图片高度一致
const loadingHeight = computed(() =>
{
    if (!props.autoHeight && props.width)
    {
        return props.width * props.scale + 'px'
    }
    return '100%'
})
// thumbnail 时在路径扩展名前插 _thumb（保留 query/hash）
const displaySrc = computed(() =>
{
    if (!props.src) return ''
    if (!props.thumbnail) return props.src
    if (props.src.includes(THUMBNAIL_SUFFIX)) return props.src
    const q = props.src.indexOf('?')
    const h = props.src.indexOf('#')
    let end = props.src.length
    if (q >= 0) end = Math.min(end, q)
    if (h >= 0) end = Math.min(end, h)
    const path = props.src.slice(0, end)
    const suffix = props.src.slice(end)
    return path.replace(/\.\w+$/, ext => THUMBNAIL_SUFFIX + ext) + suffix
})
// 预览图片列表，始终为原图（去掉 _thumb 标记）
const imageList = computed(() =>
{
    if (!props.preview || !props.src)
    {
        return []
    }
    else
    {
        return [props.src.replace(THUMBNAIL_SUFFIX, '')]
    }
})
// 展示略缩图，点击图片时的处理操作
function showPreview()
{
    if (props.preview && props.src)
    {
        showViewer.value = true
    }
}
// 组件引用
</script>

<template>
    <div class="image-container" :class="{ 'auto-height': autoHeight }" ref="coverRef" :style="{
        borderRadius: typeof borderRadius === 'number' ? borderRadius + 'px' : borderRadius,
        width: width + 'px',
        height: autoHeight ? 'auto' : width * scale + 'px',
        maxWidth: width + 'px',
        maxHeight: autoHeight ? 'none' : width * scale + 'px',
        border
    }">
        <!-- 指定图片 -->
        <el-image v-if="displaySrc" :lazy="lazy" :src="displaySrc" :fit="fit" @click="showPreview" :style="{
            borderRadius: typeof borderRadius === 'number' ? borderRadius + 'px' : borderRadius,
            width: '100%',
            height: '100%'
        }">
            <template #placeholder>
                <div class="loading" :style="{
                    height: loadingHeight
                }">
                    <img src="../../assets/loading.gif" alt="Loading...">
                </div>
            </template>
            <template #error>
                <div class="loading-failed">
                    <img src="../../assets/failed.jpg" alt="Failed to load image">
                </div>
            </template>
        </el-image>
        <!-- 默认图片 -->
        <el-image v-else :src="defaultSrc" :fit="fit" :style="{
            borderRadius: typeof borderRadius === 'number' ? borderRadius + 'px' : borderRadius,
            width: '100%',
            height: '100%'
        }">
            <template #placeholder>
                <div class="loading" :style="{
                    height: loadingHeight
                }">
                    <img src="../../assets/loading.gif" alt="Loading...">
                </div>
            </template>
            <template #error>
                <div class="loading-failed">
                    <img src="../../assets/failed.jpg" alt="Failed to load image">
                </div>
            </template>
        </el-image>
        <!-- 预览设置 -->
        <el-image-viewer v-if="showViewer" :hide-on-click-modal="true" @close="() =>
        {
            showViewer = false
        }" :url-list="imageList" :teleported="true"></el-image-viewer>
    </div>
</template>

<style lang="scss" scoped>
.image-container {
    position: relative;
    overflow: hidden;
    cursor: pointer;
    background: #f8f8f8;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-sizing: border-box;
}

// 保证 el-image 填满容器并继承圆角
:deep(.el-image) {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: inherit;
}

// 图片本体填满 el-image，具体的缩放由 props.fit 控制（通过 el-image 的行内样式生效）
:deep(img),
:deep(.el-image__inner) {
    width: 100%;
    height: 100%;
    display: block;
}

// autoHeight 模式下，图片按原始比例显示，高度自适应
.auto-height {

    :deep(img),
    :deep(.el-image__inner) {
        height: auto;
    }

    :deep(.el-image__wrapper),
    :deep(.el-image__placeholder),
    :deep(.el-image__error) {
        height: auto;
    }
}

// 加载和错误占位符也要填满
:deep(.el-image__wrapper),
:deep(.el-image__placeholder),
:deep(.el-image__error) {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
