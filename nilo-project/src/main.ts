import { createApp } from 'vue'
import App from '@/app/App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from '@/app/router'

import '@/assets/scss/base.scss'
import '@/app/styles/warm-theme.scss'
// 200：热门榜的细体大号名次；800：区块标题
import '@fontsource/geist-sans/latin-200.css'
import '@fontsource/geist-sans/latin-400.css'
import '@fontsource/geist-sans/latin-500.css'
import '@fontsource/geist-sans/latin-600.css'
import '@fontsource/geist-sans/latin-700.css'
import '@fontsource/geist-sans/latin-800.css'
import '@fontsource/geist-mono/latin-400.css'
import '@fontsource/geist-mono/latin-500.css'
import '@/assets/icon/iconfont.css'
import '@/assets/icon/iconfont-v2.css'
import { createPinia } from 'pinia'

const pinia = createPinia()
const app = createApp(App)
app.use(ElementPlus)
app.use(router)
app.use(pinia)

app.mount('#app')

