<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useUserHomeBgImg } from '../model/useUserHomeBgImg';
import { UserHomeBgImgApi } from '../api/UserHomeBgImgApi';

const props = defineProps<{
    show: boolean,
    currentThemeIndex: number,
}>()

const emit = defineEmits<{
    (e: 'update:show', value: boolean): void;
    /** 切换预览壁纸 */
    (e: 'preview', index: number | null): void;
    /** 保存壁纸更改 */
    (e:'saveTheme', index: number): void
}>()

const { backgroundList, selectedIndex, selectWallpaper } = useUserHomeBgImg();
const shouldRenderWallpapers = ref(false);

// 将show属性包装
const drawerShow = computed({
    get: () => props.show,
    set: (value: boolean) => emit('update:show', value),
})

/** 点击选中壁纸，同时发出预览事件 */
function onSelectWallpaper(index: number)
{
    selectWallpaper(index);
    emit('preview', index);
}

function beforeDrawerClose()
{
    // 关闭前清除预览，还原后端主题
    emit('preview', null);
    emit('update:show', false);
}

async function handleSave() {
    const result = await UserHomeBgImgApi.saveTheme(selectedIndex.value)

    if (result) {
        emit('update:show', false);
        emit('saveTheme', selectedIndex.value);
    }
}

// drawer 打开时同步选中状态
watch(() => props.show, (newVal) =>
{
    if (newVal)
    {
        selectedIndex.value = props.currentThemeIndex;
    }
    else
    {
        shouldRenderWallpapers.value = false;
    }
})

</script>

<template>
    <div class="background-img-editor">
        <el-drawer v-model="drawerShow" append-to-body title="更换主页壁纸" direction="btt" :before-close="beforeDrawerClose"
            size="400px" @opened="shouldRenderWallpapers = true" @closed="shouldRenderWallpapers = false">
            <template #default>
                <div v-if="shouldRenderWallpapers" class="wallpaper-grid">
                    <div v-for="item in backgroundList" :key="item.index"
                        :class="['wallpaper-item', { active: item.index === selectedIndex }]"
                        @click="onSelectWallpaper(item.index)">
                        <img :src="item.url" :alt="`壁纸 ${item.index}`" loading="lazy" decoding="async" />
                        <span class="wallpaper-index">{{ item.index }}</span>
                    </div>
                </div>
            </template>
            <template #footer>
                <el-button type="primary" @click="handleSave">保存</el-button>
            </template>
        </el-drawer>
    </div>
</template>

<style lang="scss" scoped>
.wallpaper-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px;
    padding: 8px 0;

    .wallpaper-item {
        position: relative;
        min-width: 0;
        aspect-ratio: 16 / 9;
        contain: paint;
        background-color: #f5f7fa;
        border-radius: 12px;
        overflow: hidden;
        cursor: pointer;
        border: 3px solid transparent;
        transition: border-color 0.2s ease, transform 0.2s ease;

        &:hover {
            transform: scale(1.03);
        }

        &.active {
            border-color: #409eff;
            box-shadow: 0 0 12px rgba(64, 158, 255, 0.4);
        }

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }

        .wallpaper-index {
            position: absolute;
            bottom: 6px;
            right: 8px;
            background: rgba(0, 0, 0, 0.5);
            color: #fff;
            font-size: 12px;
            padding: 2px 8px;
            border-radius: 10px;
        }
    }
}
</style>
