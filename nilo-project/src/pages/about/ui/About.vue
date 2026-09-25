<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const homeHref = router.resolve({ name: 'index' }).href
const repoHref = 'https://github.com/avaNeon/nilo-webpage'

const markRef = ref<HTMLElement | null>(null)
const dotX = ref(0)
const dotY = ref(0)
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

/** 大圆里的蓝点跟着光标轻轻偏一点，离开页面再回到原位 */
function onMove(event: MouseEvent)
{
    const mark = markRef.value
    if (reduceMotion.matches || !mark)
    {
        return
    }
    const box = mark.getBoundingClientRect()
    const centerX = box.left + box.width * 0.66
    const centerY = box.top + box.height * 0.34
    const offsetX = event.clientX - centerX
    const offsetY = event.clientY - centerY
    const distance = Math.hypot(offsetX, offsetY) || 1
    const reach = Math.min(1, distance / 600) * box.width * 0.08
    dotX.value = (offsetX / distance) * reach
    dotY.value = (offsetY / distance) * reach
}

function onLeave()
{
    dotX.value = 0
    dotY.value = 0
}

const marqueeRows = [
    ['前方高能', '这一秒我们都在', '空降成功', 'BGM 好评', '第三遍了', '名场面', '泪目', 'UP 主加油'],
    ['打卡', '这就是我想要的周末', '画质好好', '3:12 那里笑死', '好家伙', '期待下一期', '已关注', '来了来了'],
    ['awsl', '看完立刻想出门', '这个转场绝了', '收藏了', '2026 还有人在看吗', '好听', '讲得很清楚', '新人 UP 加油'],
]
const marqueeDuration = [46, 60, 52]

const points = [
    {
        no: '01',
        title: '拖进来，就是投稿',
        desc: '一次选多个文件，每个文件自动成为一个分P。填好标题、封面和分区，点一下提交就开始上传。',
    },
    {
        no: '02',
        title: '在同一秒相遇',
        desc: '弹幕让看同一支视频的人在同一个时刻说话。滚动、顶部、底部，颜色随你。',
    },
    {
        no: '03',
        title: '数据，一眼看懂',
        desc: '创作中心把播放、弹幕、评论、点赞放在一张卡片上，点一下就能看到近 7 天的走势。',
    },
]
</script>

<template>
    <div class="about-page" @mousemove="onMove" @mouseleave="onLeave">
        <header class="about-header">
            <div class="brand">
                <span class="brand-mark" aria-hidden="true"></span>
                <span class="brand-name">光点</span>
                <span class="mono brand-latin">NILO</span>
            </div>
            <span class="mono header-meta">VIDEO COMMUNITY · EST. 2026</span>
        </header>

        <section class="hero">
            <div class="hero-copy">
                <span class="mono eyebrow">( 01 ) 关于光点</span>
                <h1>每一个光点，<br>都值得被看见。</h1>
                <p class="lede">光点是一个完全开源的视频平台。代码公开在仓库里，任何人都可以阅读、部署，也可以一起把它改得更好。</p>
                <div class="hero-actions">
                    <a class="home-link" :href="homeHref" target="_blank" rel="noopener noreferrer">
                        访问主页
                        <span class="home-arrow" aria-hidden="true">→</span>
                    </a>
                    <a class="repo-link" :href="repoHref" target="_blank" rel="noopener noreferrer">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor"
                            stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M7 5.5L2.5 10 7 14.5" />
                            <path d="M13 5.5l4.5 4.5-4.5 4.5" />
                        </svg>
                        访问仓库
                    </a>
                </div>
            </div>
            <div class="hero-mark-wrap">
                <div ref="markRef" class="hero-mark">
                    <span class="hero-dot" :style="{ transform: `translate(${dotX}px, ${dotY}px)` }"></span>
                    <span class="mono hero-caption">光点 · NILO</span>
                </div>
            </div>
        </section>

        <section class="marquee" aria-hidden="true">
            <div v-for="(row, rowIndex) in marqueeRows" :key="rowIndex"
                :class="['marquee-track', { reverse: rowIndex === 1, emphasis: rowIndex === 1 }]"
                :style="{ animationDuration: marqueeDuration[rowIndex] + 's' }">
                <span v-for="copy in 2" :key="copy" class="marquee-copy">
                    <span v-for="word in row" :key="word" class="marquee-item">
                        {{ word }}
                        <span class="marquee-dot"></span>
                    </span>
                </span>
            </div>
        </section>

        <section class="project">
            <div class="section-head">
                <h2>关于这个项目</h2>
                <span class="mono eyebrow">( 02 ) 完全开源</span>
            </div>
            <div class="project-grid">
                <p class="project-lead">光点从第一行代码起就是开源的。前端、后端和播放相关的实现都公开在仓库里，任何人都可以阅读、部署和改进它。</p>
                <div class="project-body">
                    <p>这是一个完全开源的视频平台：投稿、弹幕、评论和创作数据都在同一处。想看它怎么做的，打开仓库就行。</p>
                    <p>你可以提交 Issue 报告问题，发起 Pull Request 贡献功能，也可以把它部署在自己的服务器上，搭一个只属于你们的光点。</p>
                    <div class="chips">
                        <span class="mono chip">完全开源</span>
                        <span class="mono chip">自托管</span>
                        <span class="mono chip">欢迎贡献</span>
                    </div>
                </div>
            </div>
        </section>

        <section class="points">
            <div class="section-head">
                <h2>三件小事</h2>
                <span class="mono eyebrow">( 03 ) 我们在意的</span>
            </div>
            <div v-for="point in points" :key="point.no" class="point">
                <span class="mono point-no">{{ point.no }}</span>
                <span class="point-title">{{ point.title }}</span>
                <span class="point-desc">{{ point.desc }}</span>
            </div>
        </section>

        <footer class="about-footer">
            <div class="wordmark">
                <span class="footer-mark" aria-hidden="true"></span>
                <span class="footer-name">NILO</span>
            </div>
            <div class="mono footer-meta">
                <span>© 2026 光点 NILO</span>
                <span>SEE EVERY LIGHT</span>
            </div>
        </footer>
    </div>
</template>

<style lang="scss" scoped>
.about-page {
    min-height: 100vh;
    background: $warm-accent;
    color: #ffffff;
    -webkit-font-smoothing: antialiased;

    &,
    * {
        font-family: $warm-font-sans;
    }
}

.about-page .mono {
    font-family: $warm-font-mono;
}

.about-header,
.hero,
.project,
.points,
.about-footer {
    max-width: 1440px;
    margin: 0 auto;
    padding-left: 48px;
    padding-right: 48px;
}

.about-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    height: 84px;
}

.brand {
    display: flex;
    align-items: center;
    gap: 10px;
}

.brand-mark,
.footer-mark {
    position: relative;
    flex-shrink: 0;
    border-radius: 50%;
    background: #ffffff;

    &::after {
        content: '';
        position: absolute;
        left: 53.6%;
        top: 21.4%;
        width: 25%;
        height: 25%;
        border-radius: 50%;
        background: $warm-accent;
    }
}

.brand-mark {
    width: 28px;
    height: 28px;

    &::after {
        left: 15px;
        top: 6px;
        width: 7px;
        height: 7px;
    }
}

.brand-name {
    font-size: 19px;
    font-weight: 800;
    letter-spacing: 0.02em;
}

.brand-latin,
.header-meta,
.eyebrow,
.hero-caption,
.footer-meta {
    font-family: $warm-font-mono;
    letter-spacing: 0.2em;
    color: $warm-accent-on-dark-2;
}

.brand-latin {
    padding-top: 2px;
    font-size: 10px;
}

.header-meta {
    font-size: 11px;
}

.hero {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 520px), 1fr));
    gap: clamp(40px, 6vw, 96px);
    align-items: center;
    padding-top: clamp(32px, 6vw, 80px);
    padding-bottom: clamp(64px, 8vw, 120px);
}

.hero-copy {
    display: flex;
    flex-direction: column;
    gap: 36px;
    min-width: 0;
}

.eyebrow {
    font-size: 12px;
    letter-spacing: 0.22em;
}

h1 {
    margin: 0;
    font-size: clamp(56px, 7.4vw, 112px);
    font-weight: 900;
    line-height: 1.02;
    letter-spacing: -0.03em;
    text-wrap: balance;
}

.lede {
    max-width: 30em;
    margin: 0;
    font-size: clamp(16px, 1.3vw, 19px);
    line-height: 1.8;
    color: $warm-accent-on-dark-2;
    text-wrap: pretty;
}

.hero-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 14px;
}

.home-link,
.repo-link {
    display: flex;
    align-items: center;
    height: 68px;
    border-radius: 999px;
    font-size: 18px;
    text-decoration: none;
    transition: gap 0.25s ease, background 0.2s;
}

.home-link {
    gap: 22px;
    padding: 0 12px 0 34px;
    background: #ffffff;
    color: $warm-accent;
    font-weight: 700;
    box-shadow: 0 24px 50px -22px rgba(0, 0, 0, 0.55);

    &:hover,
    &:focus-visible {
        gap: 30px;
        color: $warm-accent;
    }
}

.home-arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: $warm-accent;
    color: #ffffff;
    font-size: 20px;
}

.repo-link {
    gap: 12px;
    padding: 0 30px 0 26px;
    background: transparent;
    box-shadow: inset 0 0 0 1.5px rgba(255, 255, 255, 0.6);
    color: #ffffff;
    font-weight: 600;

    &:hover,
    &:focus-visible {
        background: rgba(255, 255, 255, 0.12);
        color: #ffffff;
    }
}

.hero-mark-wrap {
    display: flex;
    justify-content: center;
    min-width: 0;
}

.hero-mark {
    position: relative;
    width: 100%;
    max-width: 600px;
    aspect-ratio: 1;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 60px 120px -50px rgba(0, 0, 0, 0.45);
}

.hero-dot {
    position: absolute;
    left: 53.6%;
    top: 21.4%;
    width: 25%;
    height: 25%;
    border-radius: 50%;
    background: $warm-accent;
    transition: transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.hero-caption {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 16%;
    font-size: 11px;
    text-align: center;
    color: $warm-accent;
}

.marquee {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 28px 0;
    overflow: hidden;
    border-top: 1px solid rgba(255, 255, 255, 0.22);
    border-bottom: 1px solid rgba(255, 255, 255, 0.22);
}

.marquee-track {
    display: flex;
    width: max-content;
    animation: about-scroll linear infinite;

    &.reverse {
        animation-name: about-scroll-reverse;
    }
}

.marquee-copy,
.marquee-item {
    display: flex;
    align-items: center;
    flex-shrink: 0;
}

.marquee-item {
    gap: 56px;
    padding-right: 56px;
    font-size: 28px;
    font-weight: 500;
    color: $warm-accent-on-dark-2;
    white-space: nowrap;
}

.emphasis .marquee-item {
    font-size: 44px;
    font-weight: 800;
    letter-spacing: -0.01em;
    color: #ffffff;
}

.marquee-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5);
}

.project,
.points {
    display: flex;
    flex-direction: column;
    padding-top: clamp(72px, 9vw, 140px);
}

.project {
    gap: clamp(40px, 5vw, 72px);
}

.section-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 24px;
    flex-wrap: wrap;
}

.points .section-head {
    padding-bottom: 40px;
}

h2 {
    margin: 0;
    font-size: clamp(36px, 4vw, 56px);
    font-weight: 800;
    letter-spacing: -0.02em;
}

.project-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 440px), 1fr));
    gap: clamp(32px, 5vw, 80px);
    align-items: start;
}

.project-lead {
    margin: 0;
    font-size: clamp(26px, 2.6vw, 38px);
    font-weight: 700;
    line-height: 1.45;
    letter-spacing: -0.01em;
    text-wrap: pretty;
}

.project-body {
    display: flex;
    flex-direction: column;
    gap: 22px;
    font-size: 16px;
    line-height: 1.85;
    color: $warm-accent-on-dark-2;

    p {
        margin: 0;
        text-wrap: pretty;
    }
}

.chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding-top: 6px;
}

.chip {
    display: flex;
    align-items: center;
    height: 32px;
    padding: 0 14px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.12);
    font-family: $warm-font-mono;
    font-size: 12px;
    letter-spacing: 0;
    color: #ffffff;
}

.point {
    display: grid;
    grid-template-columns: minmax(64px, 120px) minmax(0, 1.1fr) minmax(0, 1fr);
    gap: clamp(20px, 3vw, 48px);
    align-items: baseline;
    padding: clamp(28px, 3vw, 44px) 0;
    border-top: 1px solid rgba(255, 255, 255, 0.22);
}

.point-no {
    font-size: 14px;
    color: $warm-accent-on-dark-2;
}

.point-title {
    font-size: clamp(30px, 3.6vw, 52px);
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.15;
    text-wrap: balance;
}

.point-desc {
    font-size: 16px;
    line-height: 1.8;
    color: $warm-accent-on-dark-2;
    text-wrap: pretty;
}

.about-footer {
    display: flex;
    flex-direction: column;
    gap: 40px;
    padding-top: clamp(80px, 10vw, 160px);
    padding-bottom: 36px;
}

.wordmark {
    display: flex;
    align-items: center;
    gap: clamp(16px, 2.4vw, 36px);
    padding-top: clamp(32px, 4vw, 56px);
    border-top: 1px solid rgba(255, 255, 255, 0.22);
}

.footer-mark {
    width: clamp(96px, 17vw, 240px);
    aspect-ratio: 1;
}

.footer-name {
    font-size: clamp(120px, 22vw, 320px);
    font-weight: 800;
    line-height: 0.8;
    letter-spacing: -0.06em;
}

.footer-meta {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    font-size: 11px;
    letter-spacing: 0.18em;
}

@keyframes about-scroll {
    from {
        transform: translateX(0);
    }

    to {
        transform: translateX(-50%);
    }
}

@keyframes about-scroll-reverse {
    from {
        transform: translateX(-50%);
    }

    to {
        transform: translateX(0);
    }
}

@media (max-width: 860px) {
    .about-header,
    .hero,
    .project,
    .points,
    .about-footer {
        padding-left: 20px;
        padding-right: 20px;
    }

    .header-meta {
        display: none;
    }

    .point {
        grid-template-columns: 1fr;
        gap: 12px;
    }

    .footer-name {
        font-size: clamp(64px, 18vw, 120px);
    }
}

@media (prefers-reduced-motion: reduce) {
    .marquee-track {
        animation: none;
    }

    .hero-dot {
        transition: none;
    }
}
</style>
