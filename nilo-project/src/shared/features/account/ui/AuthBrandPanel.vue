<script lang="ts" setup>
defineProps<{
    label: string
    title: string
    sub: string
    /** 瞳孔的 transform */
    pupilTransform: string
    /** 出错时瞳孔变红 */
    alert?: boolean
}>()
</script>

<template>
    <aside class="brand-panel">
        <div class="brand">
            <span class="brand-mark"><i></i></span>
            <span class="brand-name">光点</span>
            <span class="brand-tag">LUMI</span>
        </div>

        <div class="stage" aria-hidden="true">
            <span class="eye">
                <span :class="['pupil', { 'is-alert': alert }]" :style="{ transform: pupilTransform }"></span>
            </span>
        </div>

        <div class="copy">
            <span class="label">{{ label }}</span>
            <h2>{{ title }}</h2>
            <p>{{ sub }}</p>
        </div>
    </aside>
</template>

<style lang="scss" scoped>
.brand-panel {
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 26px 28px 30px;
    border-radius: 24px;
    background-color: $warm-accent;
    background-image: radial-gradient(rgba(255, 255, 255, 0.18) 1.2px, transparent 1.6px);
    background-size: 22px 22px;
    background-position: 11px 11px;
    color: #FFFFFF;
}

.brand {
    display: flex;
    align-items: center;
    gap: 10px;
}

.brand-mark {
    position: relative;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #FFFFFF;

    i {
        position: absolute;
        left: 15px;
        top: 6px;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: $warm-accent;
    }
}

.brand-name {
    font-size: 19px;
    font-weight: 800;
    letter-spacing: 0.02em;
}

.brand-tag {
    padding-top: 2px;
    font-family: $warm-font-mono;
    font-size: 10px;
    letter-spacing: 0.2em;
    color: $warm-accent-on-dark-2;
}

.stage {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 0;
}

.eye {
    position: relative;
    width: 168px;
    height: 168px;
    border-radius: 50%;
    background: #FFFFFF;
    box-shadow:
        0 0 0 18px rgba(255, 255, 255, 0.09),
        0 0 0 40px rgba(255, 255, 255, 0.05),
        0 30px 60px -18px rgba(0, 0, 70, 0.7);
}

.pupil {
    position: absolute;
    left: 61px;
    top: 61px;
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: $warm-accent;
    transition: transform 0.5s cubic-bezier(0.3, 1.45, 0.5, 1), background-color 0.2s;

    &.is-alert {
        background: oklch(0.55 0.2 25);
    }

    @media (prefers-reduced-motion: reduce) {
        transition: background-color 0.2s;
    }
}

.copy {
    display: flex;
    flex-direction: column;
    gap: 10px;

    .label {
        font-family: $warm-font-mono;
        font-size: 11px;
        letter-spacing: 0.22em;
        color: $warm-accent-on-dark-2;
    }

    h2 {
        margin: 0;
        font-size: 28px;
        font-weight: 800;
        letter-spacing: -0.01em;
        line-height: 1.25;
    }

    p {
        margin: 0;
        font-size: 14px;
        line-height: 1.7;
        color: $warm-accent-on-dark-2;
        text-wrap: pretty;
    }
}
</style>
