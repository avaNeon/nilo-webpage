<script lang="ts" setup>
import { onBeforeUnmount, ref, watch } from 'vue';
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
const saving = ref(false);

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

async function handleSave()
{
    if (saving.value) return

    // 没换就直接关掉
    if (selectedIndex.value === props.currentThemeIndex)
    {
        beforeDrawerClose()
        return
    }

    saving.value = true
    try
    {
        const result = await UserHomeBgImgApi.saveTheme(selectedIndex.value)

        if (result)
        {
            emit('update:show', false);
            emit('saveTheme', selectedIndex.value);
        }
    }
    finally
    {
        saving.value = false
    }
}

function onKeydown(event: KeyboardEvent)
{
    if (event.key === 'Escape') beforeDrawerClose()
}

// 打开时同步选中状态
watch(() => props.show, (newVal) =>
{
    if (newVal)
    {
        selectedIndex.value = props.currentThemeIndex;
        window.addEventListener('keydown', onKeydown)
    }
    else
    {
        window.removeEventListener('keydown', onKeydown)
    }
})

onBeforeUnmount(() =>
{
    window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
    <!-- 底部玻璃面板：选中即预览，保存才写回后端 -->
    <Teleport to="body">
        <Transition name="wallpaper-sheet">
            <div v-if="show" class="wallpaper-sheet-layer warm-theme">
                <div class="wallpaper-sheet" role="dialog" aria-modal="true" aria-label="更换主页壁纸">
                    <div class="sheet-head">
                        <div class="sheet-title">
                            <span class="title">更换主页壁纸</span>
                            <span class="subtitle">选中即可预览，背景会固定铺满整个页面</span>
                        </div>
                        <button type="button" class="close-button" aria-label="关闭" @click="beforeDrawerClose">×</button>
                    </div>

                    <div class="wallpaper-grid" role="radiogroup" aria-label="壁纸">
                        <button v-for="item in backgroundList" :key="item.index" type="button"
                            :class="['wallpaper-item', { active: item.index === selectedIndex }]" role="radio"
                            :aria-checked="item.index === selectedIndex" :aria-label="`壁纸 ${item.index}`"
                            @click="onSelectWallpaper(item.index)">
                            <img :src="item.url" alt="" loading="lazy" decoding="async" />
                            <span class="wallpaper-no">{{ String(item.index).padStart(2, '0') }}</span>
                            <span v-if="item.index === selectedIndex" class="wallpaper-tag">已选</span>
                            <span v-else-if="item.index === currentThemeIndex" class="wallpaper-tag">当前</span>
                        </button>
                    </div>

                    <div class="sheet-actions">
                        <button type="button" class="cancel-button" @click="beforeDrawerClose">取消</button>
                        <button type="button" class="save-button" :disabled="saving" @click="handleSave">
                            {{ saving ? '保存中…' : '保存' }}
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style lang="scss" scoped>
@use '@/pages/userHome/shared/styles/glass' as *;

// 不压暗页面，方便看预览效果
.wallpaper-sheet-layer {
    position: fixed;
    inset: 0;
    z-index: 1900;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 0 24px 24px;
    background: transparent;

    button {
        @include reset-button;
    }
}

.wallpaper-sheet {
    display: flex;
    flex-direction: column;
    gap: 22px;
    width: 100%;
    max-width: 1392px;
    padding: 26px 28px 28px;
    border-radius: 36px;
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(40px) saturate(1.8);
    -webkit-backdrop-filter: blur(40px) saturate(1.8);
    box-shadow: $glass-chip-edge, 0 40px 90px -30px rgba(11, 12, 18, 0.5);
}

.sheet-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
}

.sheet-title {
    display: flex;
    align-items: baseline;
    gap: 12px;

    .title {
        font-size: 22px;
        font-weight: 800;
        letter-spacing: -0.01em;
    }

    .subtitle {
        font-size: 13px;
        color: $warm-ink-3;
    }
}

.wallpaper-sheet-layer .close-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.7);
    color: $warm-ink-3;
    font-size: 18px;
    transition: background-color 0.2s;

    &:hover {
        background: #FFFFFF;
    }
}

.wallpaper-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 14px;
}

.wallpaper-sheet-layer .wallpaper-item {
    position: relative;
    aspect-ratio: 16 / 9;
    border-radius: 20px;
    overflow: hidden;
    background: $glass-placeholder;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.6);
    transition: box-shadow 0.2s, transform 0.2s;

    &:hover {
        transform: translateY(-2px);
    }

    // 选中：白圈 + 蓝圈（键盘焦点同样）
    &.active,
    &:focus-visible {
        outline: none;
        box-shadow: 0 0 0 3px #FFFFFF, 0 0 0 5px $warm-accent;
    }

    img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .wallpaper-no {
        position: absolute;
        left: 12px;
        top: 10px;
        font-family: $warm-font-mono;
        font-size: 10px;
        letter-spacing: 0.12em;
        color: rgba(255, 255, 255, 0.9);
        text-shadow: 0 1px 3px rgba(11, 12, 18, 0.45);
    }

    .wallpaper-tag {
        position: absolute;
        right: 10px;
        bottom: 10px;
        display: flex;
        align-items: center;
        height: 24px;
        padding: 0 10px;
        border-radius: 999px;
        background: $warm-accent;
        color: #FFFFFF;
        font-size: 11px;
        font-weight: 600;
    }
}

.sheet-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.wallpaper-sheet-layer .cancel-button {
    display: flex;
    align-items: center;
    height: 46px;
    padding: 0 24px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.7);
    font-size: 14px;
    font-weight: 500;
    transition: background-color 0.2s;

    &:hover {
        background: #FFFFFF;
    }
}

.wallpaper-sheet-layer .save-button {
    @include accent-button;
}

.wallpaper-sheet-enter-active,
.wallpaper-sheet-leave-active {
    transition: opacity 0.25s ease;

    .wallpaper-sheet {
        transition: transform 0.25s ease;
    }
}

.wallpaper-sheet-enter-from,
.wallpaper-sheet-leave-to {
    opacity: 0;

    .wallpaper-sheet {
        transform: translateY(24px);
    }
}
</style>
