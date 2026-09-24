<template>
    <!-- 垃圾桶：提手 + 盖子 + 桶身 -->
    <span class="trash-icon" aria-hidden="true"></span>
</template>

<style lang="scss" scoped>
.trash-icon {
    position: relative;
    display: block;
    width: 10px;
    height: 12px;

    // 提手（4×2）+ 盖子（10×1.5）
    &::before {
        content: '';
        position: absolute;
        left: 0;
        top: -2px;
        width: 10px;
        height: 3.5px;
        background:
            linear-gradient(#0B0C12, #0B0C12) 3px 0 / 4px 2px no-repeat,
            linear-gradient(#0B0C12, #0B0C12) 0 2px / 10px 1.5px no-repeat;
    }

    &::after {
        content: '';
        position: absolute;
        left: 1px;
        top: 3px;
        width: 8px;
        height: 9px;
        box-sizing: border-box;
        border: 1.5px solid #0B0C12;
        border-top: 0;
        border-radius: 0 0 2px 2px;
    }
}
</style>
