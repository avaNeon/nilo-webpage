import type { CarouselInstance } from "element-plus"
import { ref, useTemplateRef } from "vue"

export function useCarousel() {
    // 轮播图视频索引
    const carouselIndex = ref(0)

    // 设置轮播图视频索引（搭配el-carousel）
    function carouselChange(current: number, _prev: number): boolean {
        carouselIndex.value = current
        return true
    }

    // 这样就不用导出也能绑定元素了
    const carouselRef = useTemplateRef<CarouselInstance>('carouselRef')
    // 轮播图切换延迟，单位ms
    const changeDelay = 300
    // 轮播图切换的定时器
    let changeTimer: number | null = null

    // 切换到上一张轮播图（两次切换间隔一段时间）
    function prevCarousel() {
        // 如果正在切换轮播图，则不执行切换，避免用户快速点击左右按钮导致轮播图切换混乱
        if (changeTimer !== null) {
            return
        }
        carouselRef.value?.prev()
        changeTimer = setTimeout(() => {
            changeTimer = null
        }, changeDelay);
    }

    // 切换到下一张轮播图（两次切换间隔一段时间）
    function nextCarousel() {
        // 如果正在切换轮播图，则不执行切换，避免用户快速点击左右按钮导致轮播图切换混乱
        if (changeTimer !== null) {
            return
        }
        carouselRef.value?.next()
        changeTimer = setTimeout(() => {
            changeTimer = null
        }, changeDelay);
    }

    // 按照一个从1开始的序号设置轮播图视频索引（搭配自定义的轮播图指示点）
    function setCarousel(index: number) {
        carouselRef.value?.setActiveItem(index - 1)
    }

    return {
        carouselIndex,
        carouselChange,
        carouselRef,
        prevCarousel,
        nextCarousel,
        setCarousel
    }
}